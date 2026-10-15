# ember-ai-chatbot

Add the [Asyntai](https://asyntai.com) AI chat assistant to your Ember app. It
answers visitor questions from your own content, in more than 80 languages.

## Install

```bash
ember install ember-ai-chatbot
```

Then add your widget ID in `config/environment.js`:

```js
module.exports = function (environment) {
  const ENV = {
    // ...
    asyntai: {
      widgetId: 'asyntai_1a2b3c4d5e6f',
    },
  };
  // ...
  return ENV;
};
```

Build the app. The chat bubble is on every page.

## Where the widget ID comes from

Open the Install page in your [Asyntai dashboard](https://asyntai.com/dashboard).
The widget ID starts with `asyntai_`. Asyntai reads your website and answers
from it, so there is nothing else to set up in Ember.

## Options

All options go in the `asyntai` block of `config/environment.js`.

| Option | Default | What it does |
| --- | --- | --- |
| `widgetId` | (required) | Your Asyntai widget ID. |
| `enableInDevelopment` | `true` | Set to `false` to keep the widget off the app during `ember serve`. |
| `scriptUrl` | Asyntai CDN | Advanced. Load the widget script from another URL. |

A missing or wrong widget ID stops the build with a message that says what to
fix. The widget is never added in the `test` environment, so `ember test` runs
as before.

## How it works

The addon adds a small loader to the `{{content-for "body-footer"}}` slot of
`index.html`. It works with classic Ember CLI builds and with the Vite builds
of new Ember apps. The loader waits until the page has finished loading, then
fetches the chat widget. Your app never waits for the chat. The widget sits
outside the Ember application, so the same chat stays on the screen when a
visitor moves between routes.

Change the colours, the welcome message, the AI instructions and more in the
Asyntai dashboard. A change there shows in your app at once, with no rebuild.

## Links

- [Documentation](https://asyntai.com/documentation/integrations/ember/)
- [Asyntai](https://asyntai.com)
- Support: hello@asyntai.com

## License

MIT
