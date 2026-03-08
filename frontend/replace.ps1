$files = Get-ChildItem -Path src -Recurse -Include *.jsx,*.js,*.css
foreach ($file in $files) {
    if ($file -match 'Auth\.jsx' -or $file -match 'Auth\.css') {
       continue
    }
    
    $content = Get-Content $file.FullName -Raw
    $newContent = $content.Replace('bg-[#F5F5F0]', 'bg-earth-bg').Replace('bg-[#EBE8E0]', 'bg-earth-surface').Replace('bg-[#8C7851]', 'bg-earth-green').Replace('text-[#8C7851]', 'text-earth-green').Replace('border-[#8C7851]', 'border-earth-green').Replace('ring-[#8C7851]', 'ring-earth-green').Replace('text-[#1A1A1A]', 'text-charcoal').Replace('bg-[#1A1A1A]', 'bg-charcoal').Replace('border-[#1A1A1A]', 'border-charcoal').Replace('text-[#4A4A4A]', 'text-charcoal/80').Replace('border-[#4A4A4A]', 'border-charcoal/80').Replace('bg-[#F2EFE9]', 'bg-earth-surface').Replace('muted-gold', 'earth-green').Replace('soft-bone', 'earth-bg').Replace('warm-linen', 'earth-surface')
    
    # We also need to get any dynamic template literals, but exact string replaces are safe.
    if ($content -cne $newContent) {
        # Using [System.IO.File]::WriteAllText to ensure UTF8 encoding without BOM
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "Updated $($file.Name)"
    }
}
