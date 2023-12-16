return {
  { --"ellisonleao/gruvbox.nvim"
    "morhetz/gruvbox",
  },

  -- Configure LazyVim to load gruvbox
  {
    "LazyVim/LazyVim",
    -- "morhetz/gruvbox",
    opts = {
      colorscheme = "gruvbox",
    },
  },
}
