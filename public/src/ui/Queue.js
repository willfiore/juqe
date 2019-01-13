import React from "react";
import FlipMove from "react-flip-move";
import QueueCard from "./QueueCard";

export default function Queue(props) {

    const queueCards = props.items.map(t =>
        <QueueCard
            name={t.name}
            artist={t.artist}
            key={t.uri}
            uri={t.uri}
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