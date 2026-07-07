# Thin wrapper around the Elasticsearch REST API (single domain = ES HTTP).
# Uses HttpClient and decodes request/response bodies explicitly as UTF-8 so
# Hebrew survives the round-trip (Invoke-RestMethod on Windows PowerShell 5.1
# mis-decodes ES responses as ISO-8859-1, corrupting non-ASCII text).
Add-Type -AssemblyName System.Net.Http

if (-not $script:EsHttpClient) {
    $script:EsHttpClient = [System.Net.Http.HttpClient]::new()
    $script:EsHttpClient.Timeout = [TimeSpan]::FromMinutes(5)
}

function Invoke-Es {
    param(
        [Parameter(Mandatory)][string] $BaseUrl,
        [Parameter(Mandatory)][string] $Path,
        [string] $Method = 'GET',
        $Body = $null,
        [string] $Username,
        [string] $Password,
        [string] $ContentType = 'application/json',
        [int] $TimeoutSeconds = 0
    )

    $uri = "$($BaseUrl.TrimEnd('/'))/$($Path.TrimStart('/'))"
    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($Method), $uri)

    $token = [System.Threading.CancellationToken]::None
    if ($TimeoutSeconds -gt 0) {
        $token = [System.Threading.CancellationTokenSource]::new([TimeSpan]::FromSeconds($TimeoutSeconds)).Token
    }

    if ($Username) {
        $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$($Username):$($Password)"))
        $request.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Basic', $encoded)
    }

    if ($null -ne $Body) {
        $payload = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 50 }
        $request.Content = [System.Net.Http.ByteArrayContent]::new([Text.Encoding]::UTF8.GetBytes($payload))
        $request.Content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new($ContentType)
    }

    $response = $script:EsHttpClient.SendAsync($request, $token).GetAwaiter().GetResult()
    $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    $text = [Text.Encoding]::UTF8.GetString($bytes)

    if (-not $response.IsSuccessStatusCode) { throw "ES $([int] $response.StatusCode) $Method $uri`n$text" }
    if (-not $text) { return $null }
    return $text | ConvertFrom-Json
}
