import React from "react";

export default class QueueCard extends React.Component {
    constructor(props) {
        super(props);
    }

    heartTrack() {
        // cb("heart", this.props.uri);
    }

    render() {
        return (
            <li className="songCard">
                <div className="textGroup">
                    <div className="songTitle">{this.props.name}</div>
                    <div className="artistName">{this.props.artist}</div>
                </div>
                <i className={`heartButton fa${this.props.hearted ? "s" : "r"} fa-heart`}
                onClick={this.heartTrack}></i>
            </li>
        );
    }
}
