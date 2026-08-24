# Parse a .env file into a hashtable and fail fast on missing required keys.
function Import-DotEnv {
    param(
        [Parameter(Mandatory)][string] $Path,
        [string[]] $RequiredKeys = @()
    )

    $config = @{}
    foreach ($line in Get-Content -Path $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }

        $separatorIndex = $trimmed.IndexOf('=')
        if ($separatorIndex -lt 1) { continue }

        $key = $trimmed.Substring(0, $separatorIndex).Trim()
        $value = $trimmed.Substring($separatorIndex + 1).Trim().Trim('"').Trim("'")
        $config[$key] = $value
    }

    $missing = $RequiredKeys | Where-Object { -not $config[$_] }
    if ($missing) { throw "Missing required .env keys: $($missing -join ', ')" }

    return $config
}
