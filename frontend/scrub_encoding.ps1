$files = Get-ChildItem -Path src -Recurse -Include *.jsx,*.js,*.css
foreach ($file in $files) {
    # Using raw to get proper multiline content
    $content = Get-Content $file.FullName -Raw
    
    # Common UTF-8 artifacts from single/double quotes, dashes, bullets
    $newContent = $content.Replace([char]226+[char]128+[char]148, '-') `
                          .Replace([char]226+[char]128+[char]147, '-') `
                          .Replace([char]226+[char]128+[char]153, "'") `
                          .Replace([char]226+[char]128+[char]156, '"') `
                          .Replace([char]226+[char]128+[char]157, '"') `
                          .Replace([char]226+[char]128+[char]162, '•') `
                          .Replace('â€”', '-') `
                          .Replace('â€“', '-') `
                          .Replace('â€™', "'") `
                          .Replace('â€œ', '"') `
                          .Replace('â€', '"') `
                          .Replace('â€¢', '•')
                          
    if ($content -cne $newContent) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "Scrubbed $($file.Name)"
    }
}
