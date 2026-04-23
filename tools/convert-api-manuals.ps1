param(
    [string]$CatalogJson = "data/api/visitkorea-use-util-exercises.json",
    [string]$ZipDir = "assets/api-manuals",
    [string]$OutDir = "docs/api/manuals"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Escape-MdCell([string]$value) {
    if ($null -eq $value) { return "" }
    return ($value -replace "`r?`n", "<br>" -replace "\|", "\|").Trim()
}

function Get-SafeSlug([string]$text) {
    $slug = $text -replace "^한국관광공사_", ""
    $slug = $slug -replace "[\\/:*?`"<>|()\[\]\s]+", "-"
    $slug = $slug.Trim("-").ToLowerInvariant()
    return $slug
}

function Get-ZipEntryText([System.IO.Compression.ZipArchive]$zip, [string]$entryName) {
    $entry = $zip.GetEntry($entryName)
    if ($null -eq $entry) { return $null }
    $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Convert-DocxToMarkdown([string]$docxPath) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
    try {
        $xmlText = Get-ZipEntryText $zip "word/document.xml"
        if ([string]::IsNullOrWhiteSpace($xmlText)) { return "_본문을 찾지 못했습니다._" }

        [xml]$xml = $xmlText
        $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
        $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

        $parts = New-Object System.Collections.Generic.List[string]
        foreach ($node in $xml.SelectNodes("//w:body/*", $ns)) {
            if ($node.LocalName -eq "p") {
                $texts = $node.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.InnerText }
                $line = (($texts -join "") -replace "\s+$", "")
                if (-not [string]::IsNullOrWhiteSpace($line)) {
                    $parts.Add($line)
                    $parts.Add("")
                }
            } elseif ($node.LocalName -eq "tbl") {
                $rows = @()
                foreach ($tr in $node.SelectNodes(".//w:tr", $ns)) {
                    $cells = @()
                    foreach ($tc in $tr.SelectNodes("./w:tc", $ns)) {
                        $cellTexts = $tc.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.InnerText }
                        $cells += (Escape-MdCell(($cellTexts -join " ").Trim()))
                    }
                    if ($cells.Count -gt 0) { $rows += ,$cells }
                }
                if ($rows.Count -gt 0) {
                    $maxCols = ($rows | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
                    $header = @()
                    for ($i = 0; $i -lt $maxCols; $i++) {
                        $header += $(if ($i -lt $rows[0].Count -and $rows[0][$i]) { $rows[0][$i] } else { "Column $($i + 1)" })
                    }
                    $parts.Add("| " + ($header -join " | ") + " |")
                    $parts.Add("| " + (($header | ForEach-Object { "---" }) -join " | ") + " |")
                    foreach ($row in $rows | Select-Object -Skip 1) {
                        $normalized = @()
                        for ($i = 0; $i -lt $maxCols; $i++) {
                            $normalized += $(if ($i -lt $row.Count) { $row[$i] } else { "" })
                        }
                        $parts.Add("| " + ($normalized -join " | ") + " |")
                    }
                    $parts.Add("")
                }
            }
        }

        $content = ($parts -join "`n").Trim()
        if ([string]::IsNullOrWhiteSpace($content)) { return "_추출된 텍스트가 없습니다._" }
        return $content
    } finally {
        $zip.Dispose()
    }
}

function Get-ExcelColumnIndex([string]$cellRef) {
    $letters = ([regex]::Match($cellRef, "^[A-Z]+")).Value
    $num = 0
    foreach ($ch in $letters.ToCharArray()) {
        $num = $num * 26 + ([int][char]$ch - [int][char]'A' + 1)
    }
    return $num - 1
}

function Convert-XlsxToMarkdown([string]$xlsxPath, [int]$maxRowsPerSheet = 120, [int]$maxCols = 12) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($xlsxPath)
    try {
        $sharedStrings = @()
        $sharedXmlText = Get-ZipEntryText $zip "xl/sharedStrings.xml"
        if (-not [string]::IsNullOrWhiteSpace($sharedXmlText)) {
            [xml]$sharedXml = $sharedXmlText
            $nsShared = New-Object System.Xml.XmlNamespaceManager($sharedXml.NameTable)
            $nsShared.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
            foreach ($si in $sharedXml.SelectNodes("//x:si", $nsShared)) {
                $texts = $si.SelectNodes(".//x:t", $nsShared) | ForEach-Object { $_.InnerText }
                $sharedStrings += ($texts -join "")
            }
        }

        [xml]$workbook = Get-ZipEntryText $zip "xl/workbook.xml"
        [xml]$rels = Get-ZipEntryText $zip "xl/_rels/workbook.xml.rels"
        $nsWb = New-Object System.Xml.XmlNamespaceManager($workbook.NameTable)
        $nsWb.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
        $nsWb.AddNamespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
        $nsRel = New-Object System.Xml.XmlNamespaceManager($rels.NameTable)
        $nsRel.AddNamespace("rel", "http://schemas.openxmlformats.org/package/2006/relationships")

        $parts = New-Object System.Collections.Generic.List[string]
        foreach ($sheet in $workbook.SelectNodes("//x:sheet", $nsWb)) {
            $name = $sheet.GetAttribute("name")
            $rid = $sheet.GetAttribute("id", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
            $rel = $rels.SelectSingleNode("//rel:Relationship[@Id='$rid']", $nsRel)
            if ($null -eq $rel) { continue }
            $target = $rel.Target
            $sheetPath = if ($target.StartsWith("/")) { $target.TrimStart("/") } else { "xl/" + $target }
            $sheetPath = $sheetPath -replace "\\", "/"
            $sheetXmlText = Get-ZipEntryText $zip $sheetPath
            if ([string]::IsNullOrWhiteSpace($sheetXmlText)) { continue }

            [xml]$sheetXml = $sheetXmlText
            $nsSheet = New-Object System.Xml.XmlNamespaceManager($sheetXml.NameTable)
            $nsSheet.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")

            $rows = New-Object System.Collections.Generic.List[object[]]
            foreach ($row in $sheetXml.SelectNodes("//x:sheetData/x:row", $nsSheet)) {
                if ($rows.Count -ge $maxRowsPerSheet) { break }
                $values = New-Object string[] $maxCols
                foreach ($c in $row.SelectNodes("./x:c", $nsSheet)) {
                    $ref = $c.GetAttribute("r")
                    if ([string]::IsNullOrWhiteSpace($ref)) { continue }
                    $idx = Get-ExcelColumnIndex $ref
                    if ($idx -ge $maxCols) { continue }
                    $raw = $c.SelectSingleNode("./x:v", $nsSheet)
                    if ($null -eq $raw) { continue }
                    $value = $raw.InnerText
                    if ($c.GetAttribute("t") -eq "s") {
                        $stringIndex = 0
                        if ([int]::TryParse($value, [ref]$stringIndex) -and $stringIndex -lt $sharedStrings.Count) {
                            $value = $sharedStrings[$stringIndex]
                        }
                    }
                    $values[$idx] = Escape-MdCell($value)
                }
                if (($values | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }).Count -gt 0) {
                    $rows.Add($values)
                }
            }

            $parts.Add("### Sheet: $name")
            $parts.Add("")
            if ($rows.Count -eq 0) {
                $parts.Add("_표 데이터를 찾지 못했습니다._")
                $parts.Add("")
                continue
            }
            $parts.Add("| " + ((1..$maxCols | ForEach-Object { "C$_" }) -join " | ") + " |")
            $parts.Add("| " + ((1..$maxCols | ForEach-Object { "---" }) -join " | ") + " |")
            foreach ($rowValues in $rows) {
                $parts.Add("| " + ($rowValues -join " | ") + " |")
            }
            $parts.Add("")
            if ($rows.Count -ge $maxRowsPerSheet) {
                $parts.Add("_이 시트는 상위 $maxRowsPerSheet 행까지만 추출했습니다._")
                $parts.Add("")
            }
        }
        return (($parts -join "`n").Trim())
    } finally {
        $zip.Dispose()
    }
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$items = Get-Content -Raw $CatalogJson | ConvertFrom-Json | Sort-Object exercisesNum

foreach ($item in $items) {
    $manualZip = Split-Path ([string]$item.manual) -Leaf
    $zipPath = Join-Path $ZipDir $manualZip
    if (-not (Test-Path $zipPath)) { continue }

    $slug = Get-SafeSlug $item.utilName
    $outPath = Join-Path $OutDir ("{0:D2}-{1}.md" -f [int]$item.exercisesNum, $slug)

    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $lines = New-Object System.Collections.Generic.List[string]
        $lines.Add("# $($item.utilName)")
        $lines.Add("")
        $lines.Add("- API type: $($item.apiType)")
        $lines.Add("- API category: $($item.category)")
        $lines.Add("- Provider: $($item.provideInst)")
        $lines.Add("- Apply URL: $($item.apply)")
        $lines.Add("- Source ZIP: [../../../assets/api-manuals/$manualZip](../../../assets/api-manuals/$manualZip)")
        $lines.Add("")
        $lines.Add("## API Overview")
        $lines.Add("")
        $lines.Add("$($item.mainContents)")
        $lines.Add("")
        $lines.Add("## Files In ZIP")
        $lines.Add("")
        foreach ($entry in $zip.Entries) {
            if (-not $entry.FullName.EndsWith("/")) {
                $lines.Add("- $($entry.FullName)")
            }
        }
        $lines.Add("")
    } finally {
        $zip.Dispose()
    }

    $extractRoot = Join-Path "tmp/api-manual-extract" ([System.IO.Path]::GetFileNameWithoutExtension($manualZip))
    if (Test-Path $extractRoot) { Remove-Item -LiteralPath $extractRoot -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null
    [System.IO.Compression.ZipFile]::ExtractToDirectory((Resolve-Path $zipPath), (Resolve-Path $extractRoot))

    foreach ($file in Get-ChildItem -LiteralPath $extractRoot -Recurse -File | Sort-Object Name) {
        $ext = $file.Extension.ToLowerInvariant()
        if ($ext -eq ".docx") {
            $lines.Add("## DOCX: $($file.Name)")
            $lines.Add("")
            $lines.Add((Convert-DocxToMarkdown $file.FullName))
            $lines.Add("")
        } elseif ($ext -eq ".xlsx") {
            $lines.Add("## XLSX: $($file.Name)")
            $lines.Add("")
            $xlsxMd = Convert-XlsxToMarkdown $file.FullName
            if ([string]::IsNullOrWhiteSpace($xlsxMd)) {
                $lines.Add("_추출된 표 데이터가 없습니다._")
            } else {
                $lines.Add($xlsxMd)
            }
            $lines.Add("")
        } else {
            $lines.Add("## File: $($file.Name)")
            $lines.Add("")
            $lines.Add("_자동 Markdown 변환 대상이 아닌 파일입니다._")
            $lines.Add("")
        }
    }

    [System.IO.File]::WriteAllText((Resolve-Path .).Path + [System.IO.Path]::DirectorySeparatorChar + $outPath, ($lines -join "`n"), [System.Text.Encoding]::UTF8)
}
