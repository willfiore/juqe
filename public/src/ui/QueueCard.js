import React from "react";

export default class QueueCard extends React.Component {
    constructor(props) {
        super(props);

        console.log(props.hearted);

        this.onPressHeartButton = this.onPressHeartButton.bind(this);
        this.onPressRemoveButton = this.onPressRemoveButton.bind(this);
    }

    onPressHeartButton() {
        this.props.onPressHeartButton(this.props.uri);
    }

    onPressRemoveButton() {
        this.props.onPressRemoveButton(this.props.uri);
    }

    render() {

        let button = null;

        if (this.props.isMine) {
            button =
                <i className={`button removeButton fas fa-times`}
                    onClick={this.onPressRemoveButton} />
        } else {
            button =
                <i className={`button heartButton fa${this.props.hearted ? "s" : "r"} fa-heart`}
                    onClick={this.onPressHeartButton} />
        }

        return (
            <li className="songCard">
                <div className="textGroup">
                    <div className="songTitle">{this.props.name}</div>
                    <div className="artistName">{this.props.artist}</div>
                </div>
                {button}
            </li>
        );
    }
}
