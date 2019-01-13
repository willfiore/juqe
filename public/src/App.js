import React from "react";

import MainPage from "./ui/MainPage";
import SearchPage from "./ui/SearchPage";

import WebSocketClient from "./WebSocketClient";

// TODO:
// Refresh tokens

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.webSocketClient = new WebSocketClient(`ws://${location.host}:8080`);

        this.webSocketClient.onMessage("progress", (progress) => {
            this.setState(prevState => ({
                nowPlaying: {
                    ...prevState.nowPlaying,
                    progress
                }
            }));
        });

        this.webSocketClient.onMessage("nowPlayingTrack", (nowPlaying) => {
            this.setState({ nowPlaying });
        });

        this.webSocketClient.onMessage("queue", (queue) => {
            this.setState({ queue });
        });

        this.webSocketClient.onMessage("searchResults", (results) => {
            // Ignore received search results for an old query
            if (results.query !== this.currentSearchInput) return;

            this.setState({ lastSearchResults: results });
        });

        this.state = {
            page: "main",
            nowPlaying: {},
            queue: [],
            lastSearchResults: {
                query: "",
                items: []
            },
        }

        this.setPage = this.setPage.bind(this);
        this.search = this.search.bind(this);
        this.addToQueue = this.addToQueue.bind(this);

        this.currentSearchInput = "";
    }

    setPage(page) {
        this.setState({ page });
    }

    search(query) {
        this.webSocketClient.send("search", query);
    }

    addToQueue(uri) {
        this.webSocketClient.send("addToQueue", uri);
        this.setPage("main");
    }

    render() {
        if (this.state.page === "main") {
            return <MainPage
                onSearchBarClick={this.setPage.bind(null, "search")}
                nowPlaying={this.state.nowPlaying}
                queue={this.state.queue}
            />
        }
        else if (this.state.page === "search") {
            return <SearchPage
                onClose={this.setPage.bind(this, "main")}
                onSubmitSearch={this.search}
                onSearchInputChanged={(q) => { this.currentSearchInput = q; }}
                onClickSearchResult={this.addToQueue}
                searchResults={this.state.lastSearchResults} />
        }
    }
}