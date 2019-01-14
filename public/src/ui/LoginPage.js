import React from "react"

export default class LoginPage extends React.Component {

    constructor(props) {
        super(props);

        this.onChangeNameField = this.onChangeNameField.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onChangeNameField(e) {
        this.props.onNameFieldChanged(e.target.value);
    }

    onSubmit(e) {
        e.preventDefault();
        this.props.onSubmit();
    }

    render() {
        return (
            <div className="page loginPage">
                <div className="formContainer">
                    <h1>What's your name?</h1>
                    <form onSubmit={this.onSubmit}>
                        <input
                        autoFocus autoComplete="off" spellCheck="false" type="text" maxLength="32"
                        value={this.props.loginName}
                        onChange={this.onChangeNameField}></input>
                    </form>
                </div>
            </div>
        );
    }
}