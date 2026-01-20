param(
    [switch]$force,
    [switch]$amend
)

$remote = "https://benz-ngl@github.com/benz-ngl/benz-ngl.github.io"
$rem_spl = $remote.Split('/')
$repo = $rem_spl.Get($rem_spl.Length - 1)

# Ensure we're in a git repo
git rev-parse --is-inside-work-tree 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Not inside a git repository"
    exit 1
}

# Detect current branch
$branch = git branch --show-current 2>$null
if (-not $branch) {
    Write-Error "Detached HEAD: cannot determine current branch"
    exit 1
}

$_force = $force ? '--force-with-lease' : $null

$date = Get-Date -Format 'dddd d/M/yy - h:mm tt'

git add .

if ($amend) { git commit --amend --no-edit }
else { git commit -m "push benz-ngl.github.io $date" }

# Ensure origin exists
git remote get-url origin 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    git remote add origin $remote
}

# Pull & push on detected branch
git pull --rebase origin $branch
git push origin $branch $_force

