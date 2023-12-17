# Dotfiles
dotfiles 是用來統整環境的檔案，以便下次復原時更方便。下面是設定dotfiles的方法。

### 搬遷設定檔案
1. 創建dofiles 資料夾
```bash
mkdir ~/.dotfiles
```

2. 將設定檔案搬移。這邊需注意目錄結構必須相同，詳見[參考1.](https://arc.net/l/quote/oxvvxsff)
```bash
mv <file/folder> ~/.dotfiles
# e.g. 搬移 zsh
mv .zshrc ~/zsh/.zshrc
```

3. 由此不斷重複搬移設定檔案。

### 還原/重新映射設定檔案
1. 下載stow，此工具可以方便我們設定軟連結，由於上面我們改變了路徑位置，會導致問題。
```bash
cd ~/.dotfile
stow <folder>

# e.g. 映射 zsh
stow zsh
```


## 設定檔案的內容

```txt
.dotfiles/
├── .gitignore
├── nvim
│   └── .config
├── readme.md
└── zsh
    └── .zshrc
```

- [neovim]
- [zsh]

## zsh

## neovim
- **haskell 語法顯示**
	
	這東西真搞爛我，本以為haskell-vim 可以弄好，最後再發現原來nvim-treestie可以做到這樣的事情。

- [# Keymaps](https://www.lazyvim.org/keymaps)
	
	這個是neovim 裡面的預設鍵盤映射表，而我個人還有安裝其他套件，因此在此之後會持續更新套件映射表。
	
- **hoogle**
	
	`hoogle`是haskell的一個本地的lsp，而這邊將說明怎麼安裝他。
	- ghc: 9.6.1

1. 安裝hoogle
```bash
cabal install hoogle
```
2. 生成hoogle 資料庫
```bash
hoogle generate
```
3. 套用
```bash
hoogle data --local
```

# Reference
- [# 建立 .dotfiles 以便在任何 Macbook 上都可以擁有相同的開發環境](https://arc.net/l/quote/rogmllym)
- [# dotfiles](https://github.com/chaneyzorn/dotfiles)