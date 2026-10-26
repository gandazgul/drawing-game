# Public snapshot privacy review

Reviewed October 25, 2026. This is a focused disclosure review, not a comprehensive
security audit or a guarantee that every possible identifying detail is absent.

The public snapshot deliberately excludes private Git history, raw camera photos,
source-photo catalogs, design notes/conversation records, local editor settings,
generation prompts and sidecars, Google project configuration, spending records,
and private deployment configuration. Private originals were not deleted.

Included game artwork was visually inspected in contact sheets. Embedded PNG text,
EXIF, XMP, time metadata, and WebP metadata chunks were stripped from exported
copies without recompressing their image data. A subsequent metadata inspection
found no EXIF/XMP/IPTC/ICC payloads in the 83 exported images. Audio tag inspection
found no personal-information tags. The voice recordings are synthetic TTS.

Text and filenames were checked for family contact details, local absolute paths,
internal project identifiers, private keys, and common credential formats. Character
names and the repository owner's expressly approved authorship are retained.
Third-party copyright/license notices are retained as required.

Future contributions need the same review: do not add camera originals, private
metadata, credentials, or personal details. A clean initial snapshot does not
automatically make future commits safe.
