import React from "react";

export default function ProgressBar(props) {
    const innerStyle = {
        transform: `scaleX(${props.progress})`
    }

    return (
        <div className="progressBar" id="progressBar">
            <div className="inner" style={innerStyle}></div>
        </div>
    );
}