[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms

$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
$form.Show()

$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Chọn thư mục dự án cho WinDev Hub'
$dialog.ShowNewFolderButton = $true
$dialog.AutoUpgradeEnabled = $true

if ($args.Count -gt 0 -and (Test-Path $args[0])) {
    $dialog.SelectedPath = $args[0]
} else {
    $dialog.SelectedPath = [Environment]::GetFolderPath('UserProfile')
}

$result = $dialog.ShowDialog($form)
$form.Dispose()

if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    [Console]::WriteLine($dialog.SelectedPath)
}
