import "./sanitize.css";
import "./style.css";

import React from "react";
import ReactDOM from "react-dom";
import FlipMove from "react-flip-move";

let exportCallbacks = {};

// Global state mirror
// Not sure if this is the best way of doing this
// Maybe Redux ??
let globalState = {
    currentPage: "main",
    trackProgressPercentage: 0.0
}

function setProgressBarPercentage(value) {
    let progressbar = document.getElementById("progressBar");
    progressbar.style.setProperty("--percentage", value);
}

class NowPlayingBarContent extends React.Component {
    render() {

        return (
            <div className="nowPlayingBarContent">
                <img
                    className="albumArt"
                    src={this.props.albumArt}
                    onLoad={(e) => {
                    }}
                />
                <div className="textGroup">
                    <div className="songTitle">{this.props.songTitle}</div>
                    <div className="artistName">{this.props.artistName}</div>
                </div>
            </div>
        );
    }
}

class ProgressBar extends React.Component {
    render() {
        return (
            <div className="progressBar" id="progressBar">
                <div className="inner"></div>
            </div>
        );
    }
}

class NowPlayingBar extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            nowPlayingData: {
                name: "",
                artist: "",
                album_art_uri: "",
                duration_ms: 0,
                progress_ms: 0
            }
        };

        reactUpdateNowPlaying = (data) => {
            this.setState({nowPlayingData: data});

            globalState.trackProgressPercentage = data.progress_ms / data.duration_ms;

            if (globalState.currentPage === "main") {
                setProgressBarPercentage(globalState.trackProgressPercentage);
            }
        }
    }

    render() {
        return (
            <header className="nowPlayingBar">
                <NowPlayingBarContent
                    songTitle={this.state.nowPlayingData.name}
                    artistName={this.state.nowPlayingData.artist}
                    albumArt={this.state.nowPlayingData.album_art_uri}
                />
                <ProgressBar />
            </header>
        );
    }
}

class FlipMovePresetList extends React.Component {
    render() {
        return (
            <FlipMove typeName="ul" className={this.props.className}
                duration="350"
                easing="cubic-bezier(0.165, 0.840, 0.440, 1.000)"
                enterAnimation="fade"
                leaveAnimation="fade"
                staggerDelayBy="20"
            >
                {this.props.children}
            </FlipMove>
        );
    }
}

class QueueCard extends React.Component {
    constructor(props) {
        super(props);
    }

    heartTrack() {
        cb("heart", this.props.uri);
    }

    render() {
        return (
            <li className="songCard">
                <div className="textGroup">
                    <div className="songTitle">{this.props.song}</div>
                    <div className="artistName">{this.props.artist}</div>
                </div>
                <i className={`heartButton fa${this.props.hearted ? "s" : "r"} fa-heart`}
                onClick={this.heartTrack}></i>
            </li>
        );
    }
}

class Queue extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            queue: []
        }

        reactUpdateQueue = (queue) => {
            this.setState({queue});
        }
    }

    render() {

        const queueCards = this.state.queue.map(x =>
            <QueueCard
                song={x.name}
                artist={x.artist}
                key={x.uri}
                uri={x.uri}
                hearted={false}
            />
        );

        return (
            <FlipMove typeName="ul" className="queueCardList"
                duration="350"
                easing="cubic-bezier(0.165, 0.840, 0.440, 1.000)"
                enterAnimation="fade"
                leaveAnimation="fade"
                staggerDelayBy="20"
            >
                {queueCards}
            </FlipMove>
        );
    }
}

class SearchBar extends React.Component {

    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleIconPress = this.handleIconPress.bind(this);

        this.focusTimer = {};
    }

    open() {
        const inputField = document.getElementById("search_input_field");

        this.props.onFocus();
        this.focusTimer = setTimeout(() => {
            inputField.focus();
        }, 400);
    }

    handleIconPress() {
        if (this.props.isOpen) {
            this.props.onBack();
        } else {
            this.open();
        }
    }

    handleMouseDown(e) {
        if (!this.props.isOpen) {
            e.preventDefault();
            this.open();
        }
    }

    handleChange(e) {
        this.props.onSearchInputChange(e.target.value);
    }

    render() {

        const iconClass = this.props.isOpen ?
            "fas fa-chevron-left" :
            "fas fa-search";

        return(
            <div className="searchBar">
                <div className="icon" onMouseDown={this.handleIconPress}>
                    <i className={iconClass}></i>
                </div>
                <input
                    id="search_input_field"
                    onMouseDown={this.handleMouseDown}
                    type="text" value={this.props.searchInput} placeholder="Search for music"
                    onChange={this.handleChange} 
                ></input>
            </div>
        );
    }
}

class SearchResultCard extends React.Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        cb("addToQueue", this.props.uri);
    }

    render() {
        return (
            <li className="songCard"
            onMouseDown={this.handleClick}>
                <div className="textGroup">
                    <div className="songTitle">{this.props.song}</div>
                    <div className="artistName">{this.props.artist}</div>
                </div>
            </li>
        );
    }
}

class SearchDialog extends React.Component {
    constructor(props) {
        super (props);

        this.state = {
            searchInput: "",
            searchResults: []
        }

        this.searchTimer = {};
        this.searchTimerDelay = 600;

        this.onSearchInputChange = this.onSearchInputChange.bind(this);
        this.onBack = this.onBack.bind(this);

        reactUpdateSearchResults = (data) => {
            if (data.query != this.state.searchInput) return;

            this.setState({searchResults: data.results});

            setProgressBarPercentage(1.0);
        }
    }

    onSearchInputChange(value) {

        const hasText = value.trim().length != 0;
        clearTimeout(this.searchTimer);

        this.setState({searchInput: hasText ? value : ""});
        this.setState({searchResults: []});

        if (globalState.currentPage !== "search") return;

        if (hasText) {
            setProgressBarPercentage(0.1);

            this.searchTimer = setTimeout(()=> {
                if (globalState.currentPage === "search") {
                    setProgressBarPercentage(0.65);
                    cb("searchQuery", this.state.searchInput);
                }
            }, this.searchTimerDelay);

        } else {
            setProgressBarPercentage(1.0);
        }

    }

    onBack() {
        this.props.onBack();
        this.setState({searchInput: "", searchResults: []});
    }

    render() {

        const results = this.state.searchResults.map(x =>
            <SearchResultCard
                song={x.name}
                artist={x.artist}
                key={x.uri}
                uri={x.uri}
            />
        );

        return (
            <>
                <SearchBar
                    isOpen={this.props.isOpen}
                    onFocus={this.props.onFocus}
                    onBack={this.onBack}
                    searchInput={this.state.searchInput}
                    onSearchInputChange={this.onSearchInputChange}
                />
                <FlipMove typeName="ul" className="searchResultsCardList"
                    duration="700"
                    easing="cubic-bezier(0.165, 0.840, 0.440, 1.000)"
                    enterAnimation="fade"
                    leaveAnimation="fade"
                >
                    {results}
                </FlipMove>
            </>
        );
    }
}

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            page: "main"
        }
    }

    setPage(page) {
        if (this.state.page === page) return;

        if (page === "main") {
            setProgressBarPercentage(globalState.trackProgressPercentage);
        }
        else if (page === "search") {
            setProgressBarPercentage(1.0);
        }
        else {
            console.error("Invalid page", page);
            return;
        }

        globalState.currentPage = page;
        this.setState({ page: page });
    }

    render() {
        return (
            <>
                <section className={"mainPageContainer" + (this.state.page === "search" ? " inactive" : "")}>
                    <NowPlayingBar />
                    <Queue />
                </section>

                <section className={"searchPageContainer" + (this.state.page === "search" ? " active" : "")}>
                    <SearchDialog
                        isOpen={this.state.page === "search"}
                        onFocus={this.setPage.bind(this, "search")}
                        onBack={this.setPage.bind(this, "main")}
                    />
                </section>
                </>
        );
    }
}

export function render() {
    ReactDOM.render(<App />, document.getElementById("root"));
}

// React callbacks
let reactUpdateSearchResults;
let reactUpdateNowPlaying;
let reactUpdateQueue;

export function setSearchResults(data) {
    if (globalState.currentPage === "search") {
        reactUpdateSearchResults(data);
    }
}

export function setNowPlaying(data) {
    reactUpdateNowPlaying(data);
}

export function setQueue(queue) {
    reactUpdateQueue(queue);
}

// Export callbacks
function cb(key, ...args) {
    if (key in exportCallbacks) {
        exportCallbacks[key](...args);
    }
}

export function on(key, func) {
    exportCallbacks[key] = func;
}