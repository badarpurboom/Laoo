$url1 = "https://laoo.online/"
$url2 = "https://laoo.online/api/restaurants/slug/shree-radhe-radhe-sweet-and-restaurant"

Write-Host "Measuring $url1..."
$time1 = Measure-Command { 
    $res1 = Invoke-WebRequest -Uri $url1 -Method Get -UseBasicParsing 
}
Write-Host "Main Page: $($time1.TotalSeconds)s (Status: $($res1.StatusCode))"

Write-Host "Measuring $url2..."
$time2 = Measure-Command { 
    $res2 = Invoke-WebRequest -Uri $url2 -Method Get -UseBasicParsing 
}
Write-Host "API Slug: $($time2.TotalSeconds)s (Status: $($res2.StatusCode), Size: $($res2.RawContentLength) bytes)"
