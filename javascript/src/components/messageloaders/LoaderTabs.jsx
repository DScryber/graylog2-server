'use strict';

var React = require('react');
var Tabs = require('react-bootstrap').Tabs;
var Tab = require('react-bootstrap').Tab;
var RecentMessageLoader = require('./RecentMessageLoader');
var MessageShow = require('../search/MessageShow');
var InputsStore = require('../../stores/inputs/InputsStore');
var Immutable = require('immutable');
var MessageLoader = require('../extractors/MessageLoader');

var LoaderTabs = React.createClass({
    getInitialState() {
        return {
            message: undefined,
            inputs: undefined
        };
    },
    onMessageLoaded(message) {
        message['formatted_fields']['timestamp'] = message.fields.timestamp;
        message.fields["_id"] = message.id;
        this.setState({message: message});
        if (this.props.onMessageLoaded) {
            this.props.onMessageLoaded(message);
        }
    },
    loadData() {
        InputsStore.list((inputsList) => {
            var inputs = {};
            for(var idx in inputsList) {
                var input = inputsList[idx];
                inputs[input.id] = input;
            }
            this.setState({inputs: Immutable.Map(inputs)});
        });
    },
    componentDidMount() {
        this.loadData();
        var messageId = this.props.messageId;
        var index = this.props.index;
        if (messageId && index) {
            this.refs.messageLoader.submit(messageId, index);
        }
    },
    render() {
        var displayMessage = (this.state.message && this.state.inputs ?
            <div className="col-md-12">
            <MessageShow message={this.state.message} inputs={this.state.inputs}
                         disableTestAgainstStream={true} disableFieldActions={true}/>
            </div> : null);
        var defaultActiveKey;
        if (this.props.messageId && this.props.index) {
            defaultActiveKey = 2;
        } else {
            defaultActiveKey = 1;
        }
        return (
            <div>
                <Tabs defaultActiveKey={defaultActiveKey} animation={false}>
                    <Tab eventKey={1} title='Recent' style={{marginBottom: "10px"}}>
                        <RecentMessageLoader inputs={this.state.inputs} onMessageLoaded={this.onMessageLoaded}/>
                    </Tab>
                    <Tab eventKey={2} title='Manual' style={{marginBottom: "10px"}}>
                        <div style={{marginTop: "5px", marginBottom: "15px"}}>
                            Please provide the id and index of the message that you want to load in this form:
                        </div>

                        <MessageLoader ref="messageLoader" onMessageLoaded={this.onMessageLoaded} hidden={false} hideText={true}/>
                    </Tab>
                </Tabs>
                {displayMessage}
            </div>
        );
    }
});

module.exports = LoaderTabs;
