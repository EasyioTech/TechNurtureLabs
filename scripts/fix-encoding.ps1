$files = @(
    "c:\Users\cristy's\TechNurtureLabs\src\app\school-portal\register\page.tsx",
    "c:\Users\cristy's\TechNurtureLabs\src\components\landing\PricingHybrid.tsx",
    "c:\Users\cristy's\TechNurtureLabs\src\modules\super-admin\components\tabs\overview-tab.tsx",
    "c:\Users\cristy's\TechNurtureLabs\src\modules\super-admin\components\tabs\payment-plans-tab.tsx",
    "c:\Users\cristy's\TechNurtureLabs\src\modules\super-admin\components\tabs\promo-codes-tab.tsx",
    "c:\Users\cristy's\TechNurtureLabs\src\modules\super-admin\components\tabs\schools-tab.tsx",
    "c:\Users\cristy's\TechNurtureLabs\src\modules\super-admin\components\engagement-charts.tsx",
    "c:\Users\cristy's\TechNurtureLabs\src\modules\super-admin\components\promo-code-dialog.tsx"
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) { Write-Host "SKIP: $file"; continue }

    $bytes = [System.IO.File]::ReadAllBytes($file)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    $original = $content

    $badRupee      = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xE2, 0x82, 0xB9))
    $badEmDash     = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xE2, 0x80, 0x94))
    $badLSQuote    = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xE2, 0x80, 0x98))
    $badRSQuote    = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xE2, 0x80, 0x99))
    $badMiddleDot  = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xC2, 0xB7))
    $badEllipsis   = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xE2, 0x80, 0xA6))
    $badMinus      = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xE2, 0x88, 0x92))
    $badNBSP       = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xC2, 0xA0))
    $badParty      = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xF0, 0x9F, 0x8E, 0x89))
    $badBoldA      = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xC3, 0xA2))
    $badCurlyBrace = [System.Text.Encoding]::Latin1.GetString([byte[]]@(0xE2, 0x80, 0x9D))

    $content = $content.Replace($badRupee,     [char]0x20B9)
    $content = $content.Replace($badEmDash,    [char]0x2014)
    $content = $content.Replace($badLSQuote,   [char]0x2018)
    $content = $content.Replace($badRSQuote,   [char]0x2019)
    $content = $content.Replace($badMiddleDot, [char]0x00B7)
    $content = $content.Replace($badEllipsis,  [char]0x2026)
    $content = $content.Replace($badMinus,     [char]0x2212)
    $content = $content.Replace($badNBSP,      ' ')
    $content = $content.Replace($badParty,     '🎉')

    if ($content -ne $original) {
        [System.IO.File]::WriteAllBytes($file, [System.Text.Encoding]::UTF8.GetBytes($content))
        Write-Host "FIXED: $file"
    } else {
        Write-Host "CLEAN: $file"
    }
}
Write-Host "Done!"
