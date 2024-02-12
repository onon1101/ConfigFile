-- bootstrap lazy.nvim, LazyVim and your plugins
require("config.lazy")

polish = function()
require("notify").setup({
  background_colour = "#1a1b26",
})

vim.schedule(function()
  vim.opt.termguicolors = true
end)
