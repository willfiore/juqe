import React from "react";

export default class SearchResultsCard extends React.Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.props.onClick(this.props.uri);
    }

    render() {
        return (
            <li className="songCard"
            onMouseDown={this.handleClick}>
                <div className="textGroup">
                    <div className="songTitle">{this.props.name}</div>
                    <div className="artistName">{this.props.artist}</div>
                </div>
            </li>
        );
    }
}
