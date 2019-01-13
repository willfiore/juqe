import React from "react";
import FlipMove from "react-flip-move";
import SearchResultsCard from "./SearchResultsCard";

export default function SearchResults(props) {

    const resultsCards = props.items.map(t =>
        <SearchResultsCard
            name={t.name}
            artist={t.artist}
            key={t.uri}
            uri={t.uri}
            onClick={props.onClickSearchResult}
        />
    );

    return (
        <FlipMove typeName="ul" className="searchResultsCardList"
            duration="100"
            easing="cubic-bezier(0.165, 0.840, 0.440, 1.000)"
            enterAnimation="fade"
            leaveAnimation="fade"
            staggerDelayBy="20"
        >
            {resultsCards}
        </FlipMove>
    );
}