<#
  Creates the local MySQL database for Klearity and Klarity.

  Run it once:
      powershell -ExecutionPolicy Bypass -File scripts\setup-db.ps1

  It asks for your MySQL root password (the one you set during installation).
  To skip the prompt:
      $env:MYSQL_PWD = "your-root-password"

  If you prefer not to create a separate app user, the backend defaults to the
  root account and the JDBC URL carries createDatabaseIfNotExist=true, so the
  script is optional. Run it when you want a dedicated least-privilege user.
#>

param(
    [string]$DbName  = "klearity",
    [string]$AppUser = "klarity_app",
    [string]$AppPass = "klarity_app",
    [string]$RootUser = "root",
    [string]$HostName = "localhost",
    [int]$Port = 3306
)

$ErrorActionPreference = "Stop"

# Prefer the mysql client that ships with the MySQL install, fall back to PATH.
$mysqlCandidates = @(
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\laragon\bin\mysql"
) + (Get-ChildItem "C:\Program Files\MySQL" -Directory -ErrorAction SilentlyContinue |
     ForEach-Object { Join-Path $_.FullName "bin\mysql.exe" })

$mysql = $mysqlCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $mysql) { $mysql = (Get-Command mysql -ErrorAction SilentlyContinue).Source }

if (-not $mysql) {
    Write-Host "mysql.exe not found." -ForegroundColor Red
    Write-Host "Either install MySQL 8 (or XAMPP/Laragon), or just start the backend:" -ForegroundColor Gray
    Write-Host "the default JDBC URL includes createDatabaseIfNotExist=true, so Hibernate" -ForegroundColor Gray
    Write-Host "creates the database for you using the root credentials in backend\.env." -ForegroundColor Gray
    exit 1
}

Write-Host "Using mysql: $mysql" -ForegroundColor Cyan

if (-not $env:MYSQL_PWD) {
    $secure = Read-Host -AsSecureString "MySQL root password for '$RootUser' (press Enter if it is empty)"
    $env:MYSQL_PWD = [System.Net.NetworkCredential]::new("", $secure).Password
}

function Invoke-Db {
    param([string]$Sql, [string]$Database = "mysql")
    & $mysql --host=$HostName --port=$Port --user=$RootUser --database=$Database `
        --default-character-set=utf8mb4 --batch --skip-column-names -e $Sql
    if ($LASTEXITCODE -ne 0) { throw "mysql exited with code $LASTEXITCODE" }
}

Write-Host "`nChecking the connection..." -ForegroundColor Cyan
Invoke-Db -Sql "SELECT VERSION();"

$charset = "utf8mb4"
$collation = "utf8mb4_unicode_ci"

Write-Host "`nCreating database '$DbName' if it does not exist..." -ForegroundColor Cyan
$exists = Invoke-Db -Sql "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='$DbName';"
if ($exists) {
    Write-Host "  database '$DbName' already exists - skipping" -ForegroundColor Yellow
} else {
    Invoke-Db -Sql "CREATE DATABASE ``$DbName`` CHARACTER SET $charset COLLATE $collation;"
    Write-Host "  created database '$DbName'" -ForegroundColor Green
}

Write-Host "`nCreating user '$AppUser' if it does not exist..." -ForegroundColor Cyan
$userExists = Invoke-Db -Sql "SELECT 1 FROM mysql.user WHERE user='$AppUser';"
if ($userExists) {
    Write-Host "  user '$AppUser' already exists - resetting its password" -ForegroundColor Yellow
    Invoke-Db -Sql "ALTER USER '$AppUser'@'%' IDENTIFIED BY '$AppPass';"
} else {
    Invoke-Db -Sql "CREATE USER '$AppUser'@'%' IDENTIFIED BY '$AppPass';"
    Write-Host "  created user '$AppUser'" -ForegroundColor Green
}

Invoke-Db -Sql "GRANT ALL PRIVILEGES ON ``$DbName``.* TO '$AppUser'@'%';"
Invoke-Db -Sql "FLUSH PRIVILEGES;"
Write-Host "  granted all privileges on '$DbName' to '$AppUser'" -ForegroundColor Green

Write-Host "`nDone. Put these in backend\.env:" -ForegroundColor Green
Write-Host "  DB_URL=jdbc:mysql://$HostName`:$Port/$DbName?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8"
Write-Host "  DB_USERNAME=$AppUser"
Write-Host "  DB_PASSWORD=$AppPass"
Write-Host "`nLeave createDatabaseIfNotExist out of the URL now that the database exists." -ForegroundColor Gray
