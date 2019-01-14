import React from "react";

export default class SearchBar extends React.Component {

    constructor(props) {
        super(props);
        this.onInputMouseDown = this.onInputMouseDown.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
    }

    onInputMouseDown(e) {
        // Don't focus if not active
        if (!this.props.active) {
            e.preventDefault();
        }
    }

    onInputChange(e) {
        this.props.onInputChange(e.target.value);
    }

    render() {
        const iconClass = this.props.active ?
            "fas fa-chevron-left" :
            "fas fa-search";

        return (
            <div className="searchBar" onMouseDown={this.props.onClick}>
                <div className="icon" onMouseDown={this.props.onIconClick}>
                    <i className={iconClass}></i>
                </div>
                <input
                    id="search_input_field" type="text" value={this.props.value}
                    spellCheck="false"
                    placeholder="Search for music" autoFocus={this.props.active}
                    onMouseDown={this.onInputMouseDown} onChange={this.onInputChange}
                ></input>
            </div>
        );
    }
}