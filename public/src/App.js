import React from "react";

import LoginPage from "./ui/LoginPage";
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

        this.webSocketClient.onOpen = () => {
            // Check for stored UUID- send that to the server if so
            const uuid = localStorage.getItem("uuid");
            this.webSocketClient.send("login", uuid);
        }

        this.webSocketClient.onMessage("uuid", (uuid) => {
            this.setState({page: "login"});
            localStorage.setItem("uuid", uuid);
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

        this.webSocketClient.onMessage("loginSuccess", (myUserID) => {
            this.setState({
                page: "main",
                myUserID
            });
        });

        this.webSocketClient.onMessage("users", (users) => {
            console.log(users);
            this.setState({ users });
        });

        this.state = {
            page: "blank",
            nowPlaying: {},
            queue: [],
            lastSearchResults: {
                query: "",
                items: []
            },
            loginName: "",
            myUserID: null,
            users: {}
        }

        this.setPage = this.setPage.bind(this);
        this.search = this.search.bind(this);
        this.addToQueue = this.addToQueue.bind(this);
        this.sendName = this.sendName.bind(this);
        this.heartTrack = this.heartTrack.bind(this);
        this.removeTrack = this.removeTrack.bind(this);

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

    sendName() {
        this.webSocketClient.send("name", this.state.loginName);
    }

    heartTrack(uri) {
        this.webSocketClient.send("heart", uri);
    }

    removeTrack(uri) {
        this.webSocketClient.send("remove", uri);
    }

    render() {
        if (this.state.page === "main") {
            return <MainPage
                onSearchBarClick={this.setPage.bind(null, "search")}
                nowPlaying={this.state.nowPlaying}
                queue={this.state.queue}
                users={this.state.users}
                myUserID={this.state.myUserID}
                onPressHeartButton={this.heartTrack}
                onPressRemoveButton={this.removeTrack}
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
        else if (this.state.page === "login") {
            return <LoginPage
                loginName={this.state.loginName}
                onNameFieldChanged={(loginName) => { this.setState({loginName})}}
                onSubmit={this.sendName} />
        }
        else if (this.state.page === "blank") {
            return null;
        }
    }
}