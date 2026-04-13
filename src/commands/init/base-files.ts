export const gitignore = `
# Windows

# Windows thumbnail cache files
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db

# Dump file
*.stackdump

# Folder config file
[Dd]esktop.ini

# Recycle Bin used on file shares
$RECYCLE.BIN/

# Windows Installer files
*.cab
*.msi
*.msix
*.msm
*.msp

# Windows shortcuts
*.lnk

# Mac

## General
.DS_Store
.AppleDouble
.LSOverride

## Icon must end with two \r
Icon

## Thumbnails
._*

## Files that might appear in the root of a volume
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent

## Directories potentially created on remote AFP share
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk

# GameMaker temporary files
*.resource_order
*.old

# GMRT build directory
Build
`;
export const gitattributes = `
# Ignore .yy files for language statistics
*.yy linguist-generated=true

# force LF for metadata files for merge simplicity
*.gml text eol=lf
*.yy text eol=lf
*.yyp text eol=lf
*.json text eol=lf
`;

export function compileYml(_params: Record<string, never>): string {
  return `# TODO: fill in compile workflow`;
}

export function packageYml(_params: Record<string, never>): string {
  return `# TODO: fill in package workflow`;
}
