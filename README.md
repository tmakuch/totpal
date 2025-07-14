# Two of those people are laying baggie

Simple app that allows you to submit and choose a topic for the game.

If you want to learn what's the game - check [Matt Gary and Tom Scott video](https://www.youtube.com/watch?v=3yFEfOYTNoE).
It's a game for four people. Three people will look up a wikipedia article which one of them gets chosen at random. One person will be describing their article while the other will try to come with a believable fakes to try to convince you it's their.

## Deployed app
You can find it at [game.makuch.dev/totpal](https://game/makuch.dev/totpal).

## Development
App consists of a webpage and web socket server that allows the communication between clients. Additionally, you need to have i.e. a nginx server that will serve html and redirect websocket request to the node server (this is entirely dictated by my servers structure, there's no technical limitation for node server to be a standalone http+ws server that would server the html file as well).

`npm run start` starts nodemon process for the node server and vite in development mode with proxy set up. This will simulates fully set up nginx configuration.

## Thanks
Thanks to Naugtur, who shown me this game and created first iteration of the baggie.

Go check him at [naugtur.pl](https://naugtur.pl), if you're interested in JS you'll find interesting things there.