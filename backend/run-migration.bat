@echo off
echo ============================================
echo MIGRATION: Adding 4 new columns to curriculum_frameworks
echo ============================================

REM Default database connection settings
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=curriculum_management
set MYSQL_EXE="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

echo Checking MySQL client installation...

REM Try to find MySQL client in common locations
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_EXE="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
) else if exist "C:\Program Files\MySQL\MySQL Server 9.0\bin\mysql.exe" (
    set MYSQL_EXE="C:\Program Files\MySQL\MySQL Server 9.0\bin\mysql.exe"
) else if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_EXE="C:\xampp\mysql\bin\mysql.exe"
    set DB_USER=root
    set DB_PASSWORD=""
) else (
    echo.
    echo ERROR: Cannot find MySQL client.
    echo Please install MySQL Server or XAMPP, or install MySQL CLI.
    echo Download from: https://dev.mysql.com/downloads/windows/
    echo.
    echo Alternative: Run the SQL file manually in MySQL Workbench:
    echo File: %~dp0setup_new_columns.sql
    echo.
    pause
    exit /b 1
)

echo MySQL client found: %MYSQL_EXE%
echo.

echo Connecting to database: %DB_NAME% on %DB_HOST%
echo User: %DB_USER%
echo.

REM Run the migration
echo Executing migration SQL...

%MYSQL_EXE% -h%DB_HOST% -u%DB_USER% %DB_PASSWORD_PARAM% -D%DB_NAME% < "%~dp0setup_new_columns.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo ✅ SUCCESS: Migration completed successfully!
    echo ============================================
    echo.
    echo Added 4 new columns to curriculum_frameworks table:
    echo - total_sessions: Tổng số buổi học
    echo - session_duration_hours: Thời gian học/buổi (giờ)
    echo - learning_method: Cách thức học
    echo - learning_format: Hình thức học
    echo.
) else (
    echo.
    echo ============================================
    echo ❌ ERROR: Migration failed!
    echo ============================================
    echo.
    echo Possible issues:
    echo 1. Database connection failed
    echo 2. Database '%DB_NAME%' does not exist
    echo 3. Insufficient permissions
    echo.
    echo Please check:
    echo - MySQL Server is running
    echo - Database credentials are correct
    echo - Database '%DB_NAME%' exists
    echo.
    echo Alternative: Run manually in MySQL Workbench
    echo File: %~dp0setup_new_columns.sql
)

pause
