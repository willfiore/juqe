import React from "react";
import FlipMove from "react-flip-move";

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

        const likedByListEls = this.props.likedByUsers.map((user, idx, arr) => {

            let str = user.name;

            if (idx < arr.length - 1) {
                str += ", ";
            }

            return <div key={user.id}>{str}</div>
        });

        const likeEnterAnimation = {
            from: { opacity: 0, transform: "translateX(0.6em)" },
            to: { opacity: 1, transform: "translateX(0%)" }
        };

        return (
            <li>
                <div className="card queueCard">
                    <div className="textGroup">
                        <div className="songTitle">{this.props.name}</div>
                        <div className="artistName">{this.props.artist}</div>
                    </div>
                    {button}
                </div>
                <div className="info">
                    <i className="addedBy fas fa-plus"></i>
                    <span>Added by {this.props.addedByName}</span>
                    <i className="likedBy fas fa-heart" style={{ opacity: this.props.likedByUsers.length > 0 ? 1 : 0 }}></i>
                    <FlipMove typeName="div" className="likedByList"
                        duration="150"
                        easing="cubic-bezier(0.165, 0.840, 0.440, 1.000)"
                        enterAnimation={likeEnterAnimation}
                        leaveAnimation="fade"
                        maintainContainerHeight="true"
                    >
                        {likedByListEls}
                    </FlipMove>
                </div>
                <div className="border"></div>
            </li>
        );
    }
}
