
param(
    [switch]$force
)

if ($force) {
    $_force = '--force'
} else {
    $_force = $null
}

$date = Get-Date -Format 'dddd d/M/yy - h:mm tt'

git add .
git commit -m "push benz-ngl.github.io $date"

git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add origin "https://benz-ngl@github.com/benzaria/benz-ngl.github.io"
}

git pull origin mucho $_force
git push origin mucho $_force

