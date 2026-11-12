-- First pass of every pandoc conversion (see conversion_utils.py): reader ->
-- this filter -> JSON. Drops anything in an upload that would make pandoc or
-- weasyprint fetch a URL or read a server file (SSRF / file read via
-- `![](http://169.254.169.254/...)`, `![](/proc/self/environ)`, raw <img>).
--
-- Images embedded in an uploaded .docx are already in the media bag; they are
-- written to $CT_MEDIA_DIR and repointed so the second pass can use them.
-- Everything else is replaced by its alt text.
--
-- ponytail: allowlist by media bag, no URL parsing. Pandoc 2.17 (Debian
-- bookworm) fetches resources before filters run when it writes docx or uses
-- --extract-media, and its --sandbox can't write docx, so the JSON hop is what
-- keeps fetching out of the picture. With pandoc >= 3, --sandbox does this.
local dir = os.getenv("CT_MEDIA_DIR")
local n = 0

function Image(el)
  local mime, contents = pandoc.mediabag.lookup(el.src)
  if not contents or not dir then return el.caption end
  n = n + 1
  local path = dir .. "/m" .. n .. (el.src:match("%.%w+$") or "")
  local f = assert(io.open(path, "wb"))
  f:write(contents)
  f:close()
  el.src = path
  return el
end

function RawInline() return {} end
function RawBlock() return {} end
