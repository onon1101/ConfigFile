return {
  {
    "mrcjkb/haskell-tools.nvim",
    enabled = false,
    version = "^3",
    ft = { "haskell", "lhaskell", "cabal", "cabalproject" },
    config = function()
      local haskell_tools = require("haskell-tools")
      haskell_tools.lsp.start()
      -- haskell_tools.hoogle.hoogle_signature()
    end,
    opts = {
      noremap = true,
      silent = true,
      buffer = vim.api.nvim_get_current_buf(),
    },
    keys = {
      {
        "<leader>ca",
        vim.lsp.codelens.run,
        desc = "auto-refresh",
      },
      {
        "<leader>hs",
        function()
          require("haskell-tools").hoogle.hoogle_signature()
        end,
      },
      {
        "<leader>ea",
        function()
          require("haskell-tools").lsp.buf_eval_all()
        end,
      },
      {
        "<leader>rr",
        function()
          require("haskell-tools").repl.toggle()
        end,
      },
      {
        "<leader>rf",
        function()
          require("haskell-tools").repl.toggle(vim.api.nvim_buf_get_name(0))
        end,
      },
    },
  },
}
