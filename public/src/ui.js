import "./sanitize.css";
import "./style.css";

import React from "react";
import ReactDOM from "react-dom";

function setCssVariable(name, value) {
    let root = document.documentElement;
    root.style.setProperty("--" + name, value);
}

class NowPlayingBarContent extends React.Component {
    render() {
        return (
            <div className="nowPlayingBarContent">
                <div className="albumArt"
                style={{backgroundImage: `url(${this.props.albumArt})`}}></div>
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
            <div className="progressBar">
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
                setCssVariable("progressBarPercentage", globalState.trackProgressPercentage);
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

class QueueCard extends React.Component {
    render() {
        return (
            <li className="songCard">
                <div className="textGroup">
                    <div className="songTitle">{this.props.song}</div>
                    <div className="artistName">{this.props.artist}</div>
                </div>
                <i className="heartButton far fa-heart"></i>
            </li>
        );
    }
}

class SearchResultCard extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li className="songCard">
                <div className="textGroup">
                    <div className="songTitle">{this.props.song}</div>
                    <div className="artistName">{this.props.artist}</div>
                </div>
            </li>
        );
    }
}

class Queue extends React.Component {
    render() {
        return (
            <>
                <ul className="queueCardList">
                    <QueueCard song="Every Teardrop Is a Waterfall" artist="Coldplay"/>
                    <QueueCard song="POP/STARS" artist="K/DA, Madison Beer, (G)I-dle, Jaira Burns, League of Legends"/>
                    <QueueCard song="Not Over Yet - Perfecto Edit" artist="Grace"/>
                    <QueueCard song="Acceptable in the 80's" artist="Calvin Harris"/>
                    <QueueCard song="Ready For The Floor" artist="Hot Chip"/>
                    <QueueCard song="Cloud 9" artist="Fono, E^ST"/>
                    <QueueCard song="Strawberry Swing" artist="Coldplay"/>
                    <QueueCard song="One Kiss" artist="Calvin Harris, Dua Lipa"/>
                    <QueueCard song="Ready For The Floor" artist="Hot Chip"/>
                    <QueueCard song="Little Talks" artist="Of Monsters and Men"/>
                    <QueueCard song="17 - 6am Remix" artist="MK, KC Lights"/>
                    <QueueCard song="Without You (feat. Usher)" artist="David Guetta, Usher"/>
                    <QueueCard song="Counting Stars" artist="OneRepublic"/>
                </ul>
            </>
        );
    }
}

class SearchBar extends React.Component {

    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleBlur = this.handleBlur.bind(this);

        this.focusTimer = {};
    }

    handleMouseDown(e) {
        e.preventDefault();
        this.props.onFocus();

        this.focusTimer = setTimeout(()=>{
            const inputField = document.getElementById("search_input_field");
            inputField.focus();
        }, 400);
    }

    handleBlur() {
        clearTimeout(this.focusTimer);
        this.props.onBlur();
    }

    handleChange(e) {
        this.props.onSearchInputChange(e.target.value);
    }

    render() {
        return(
            <div className="searchBar" onMouseDown={this.handleMouseDown}>
                <i className="icon fas fa-search"></i>
                <input
                    id="search_input_field"
                    type="text" value={this.props.searchInput} placeholder="Search for music"
                    onChange={this.handleChange} onBlur={this.handleBlur}
                ></input>
            </div>
        );
    }
}

class SearchResults extends React.Component {
    render() {
        return (
            <ul className="searchResultsCardList">
                {this.props.results}
            </ul>
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
        this.onBlur = this.onBlur.bind(this);

        reactUpdateSearchResults = (data) => {
            if (data.query != this.state.searchInput) return;

            const results = data.results.map(x =>
                <SearchResultCard song={x.name} artist={x.artist} key={x.uri} />
            );

            this.setState({searchResults: results});
            setCssVariable("progressBarPercentage", 1.0);
        }
    }

    onSearchInputChange(value) {

        const hasText = value.trim().length != 0;
        clearTimeout(this.searchTimer);

        this.setState({searchInput: hasText ? value : ""});
        this.setState({searchResults: []});

        if (globalState.currentPage !== "search") return;

        if (hasText) {
            setCssVariable("progressBarPercentage", 0.1);

            this.searchTimer = setTimeout(()=> {
                if (globalState.currentPage === "search") {
                    setCssVariable("progressBarPercentage", 0.65);
                    cb_searchQuery(this.state.searchInput);
                }
            }, this.searchTimerDelay);

        } else {
            setCssVariable("progressBarPercentage", 1.0);
        }

    }

    onBlur() {
        this.props.onBlur();
        this.setState({searchInput: "", searchResults: []});
    }

    render() {
        return (
            <>
                <SearchBar
                    onFocus={this.props.onFocus}
                    onBlur={this.onBlur}
                    searchInput={this.state.searchInput}
                    onSearchInputChange={this.onSearchInputChange}
                />
                <SearchResults results={this.state.searchResults} />
            </>
        );
    }
}

// Global state mirror
let globalState = {
    currentPage: "main",
    trackProgressPercentage: 0.0
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
            setCssVariable("progressBarPercentage", globalState.trackProgressPercentage);
        }
        else if (page === "search") {
            setCssVariable("progressBarPercentage", 1.0);
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
                        onFocus={this.setPage.bind(this, "search")}
                        onBlur={this.setPage.bind(this, "main")}
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

// Exports
export function setSearchResults(data) {
    if (globalState.currentPage === "search") {
        reactUpdateSearchResults(data);
    }
}

export function setNowPlaying(data) {
    reactUpdateNowPlaying(data);
}

// Export callbacks
let cb_searchQuery;

export function setSearchQueryCallback(func) {
    cb_searchQuery = func;
}