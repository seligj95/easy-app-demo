# Custom Styles

Place your branding and style overrides here.

Create CSS files and import them in `src/app/globals.css`.

## Example

```css
/* src/custom/styles/branding.css */
:root {
  --brand-primary: #0078d4;
  --brand-secondary: #106ebe;
}
```

Then in `src/app/globals.css`, add:
```css
@import "../../custom/styles/branding.css";
```
