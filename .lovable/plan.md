# Fabric Master fixed desktop workspace

## Changes
- Keep the existing mobile fabric cards and shared filtering/actions unchanged.
- On desktop, make Fabric Master fill the available space between the fixed app header and footer without scrolling the outer page.
- Keep the title/search/Add Fabric controls visible; place the desktop table in its own vertical scroll area and make its header row sticky.
- Replace desktop Edit and Deactivate text actions with compact, accessible icon buttons while preserving edit and confirmation behavior.
- Ensure the table's final row and count remain reachable above the fixed footer.

## Verification
- Check desktop and phone layouts in the live preview, including sticky controls, row scrolling, mobile cards, and action accessibility.
- Run the project build and TypeScript checks available in the repository.
- Do not publish unless explicitly requested.

## Technical details
- Scope layout classes to `FabricPage.tsx`; no global CSS or shared layout changes.
- Use the existing fixed header/footer space already reserved by `Layout.tsx` and a desktop `min-h-0` flex structure.
