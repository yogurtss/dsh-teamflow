# Expanded conversation cards

The conversation team summary now uses 20px padding, a 48px captain avatar,
a 17px title, and a responsive member grid. Member roles are visible beneath
their names. Existing theme tokens supply all colors, with a subtle tinted
header background and keyboard focus outlines retained.

When a matching owner-scoped activity snapshot is available, the card also
shows up to three lines of team description and completed/total task progress.
Failed and cancelled tasks do not count as completed. Historical cards without
a snapshot keep their durable name and roster without inventing progress.
Both Chinese and English labels are included.

Validation: clean TypeScript/browser build, 25 card/navigation/locale tests,
project offline verification, artifact verification, and a production-component
render smoke covering both languages, progress counts, roles, description,
historical fallback, and owner isolation passed. No interactive browser visual
verification was performed.

The user authorized this card update on both dev and main. The separate gated
loops design commit on dev is not part of this card promotion.
