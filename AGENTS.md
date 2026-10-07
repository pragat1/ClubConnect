<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Uploaded club/event images go to the private `club-media` storage bucket under `<uid>/`, saved as long-lived signed links (workspace blocks public buckets).
- AI recommendations run in a server function that streams the AI Gateway Responses API and only returns ids present in the database catalog.
