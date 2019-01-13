import React from "react";
import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";

export default class SearchPage extends React.Component {

    constructor(props) {
        super(props);

        this.inputRestTimer = null;

        this.state = {
            searchQuery: "",
        };

        this.setSearchQuery = this.setSearchQuery.bind(this);
    }

    setSearchQuery(query) {
        this.setState({ searchQuery: query });

        clearTimeout(this.inputRestTimer);
        if (query.trim().length !== 0) {
            this.inputRestTimer = setTimeout(() => {
                this.props.onSubmitSearch(query);
            }, 500);
        }

        this.props.onSearchInputChanged(query);
    }

    render() {

        let searchResultsItems = this.props.searchResults.items;
        if (this.props.searchResults.query !== this.state.searchQuery) {
            searchResultsItems = [];
        }

        return (
            <div className="searchPage">
                <SearchBar active={true}
                    value={this.state.searchQuery}
                    onInputChange={this.setSearchQuery}
                    onIconClick={this.props.onClose} />
                <SearchResults
                    items={searchResultsItems}
                    onClickSearchResult={this.props.onClickSearchResult} />
            </div>
        );
    }
}
