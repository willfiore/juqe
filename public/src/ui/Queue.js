import React from "react";
import FlipMove from "react-flip-move";
import QueueCard from "./QueueCard";

export default React.memo(function Queue(props) {

    const queueCards = props.items.map(t => {

        const addedByName = props.users[t.ownerID] ? props.users[t.ownerID].name : "Null";
        const likedByUsers = t.hearts.map(id => ({
            id,
            name: props.users[id] ? props.users[id].name : "Null"
        }));

        return <QueueCard
            name={t.name}
            artist={t.artist}
            key={t.uri}
            uri={t.uri}
            isMine={props.myUserID === t.ownerID}
            hearted={t.hearts.indexOf(props.myUserID) !== -1}
            onPressHeartButton={props.onPressHeartButton}
            onPressRemoveButton={props.onPressRemoveButton}
            addedByName={addedByName}
            likedByUsers={likedByUsers}
        />
    });

    const cardEnterAnimation = {
        from: { opacity: 0, transform: "translateX(-30%)"},
        to: { opacity: 1, transform: "translateX(0%)" }
    }

    const cardLeaveAnimation = {
        from: { opacity: 1, transform: "translateY(0%)" },
        to: { opacity: 0, transform: "translateY(-50%)" }
    }

    return (
        <FlipMove typeName="ul" className="queueCardList"
            duration="350"
            easing="cubic-bezier(0.165, 0.840, 0.440, 1.000)"
            enterAnimation={cardEnterAnimation}
            leaveAnimation={cardLeaveAnimation}
            staggerDelayBy="20"
            staggerDurationBy="60"
        >
            {queueCards}
        </FlipMove>
    );
});
