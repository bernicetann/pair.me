import React, {Component} from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';
import axios from 'axios';

import 'brace/mode/javascript';
import 'brace/theme/monokai';

class Challenge extends Component {
  constructor(props) {
    super(props);
    this.state = { result: "", console: [], aceValue: "" }
  }
  submitCode(event){
    event.preventDefault();
    //to get the instance of the Editor through ace-editor name
    //finally use getValue() function to get the contents
    let editor = ace.edit('codeChallenges');
    let textValue = JSON.stringify(editor.getValue());
    this.setState({aceValue: editor.getValue()})
    var self = this;
    axios.post('/api/challenges', {
      answer: textValue
    })
    .then(function(response) {
      // console.log('RESPONSE',response.data);

      let outputData = JSON.parse(response.data);
      // console.log("PARSED",outputData);
      
      self.setState({result: outputData.result});
      self.setState({console: outputData.console});
    })
    .catch(function(error){
      console.log(error);
    })
  }
  render() {
    let console = this.state.console;
    let consoleArr = [];
    for (let i = 0; i < console.length; i++) {
      consoleArr.push(
        <ul>{ console[i] }</ul>
      )
    }
    let showResult;
    if (this.state.result !== "null"){
     showResult = <ul>{ this.state.result }</ul>;
    }
    return (
      <div>
          <AceEditor
            name="codeChallenges"
            mode="javascript"
            theme="monokai"
            editorProps={{$blockScrolling: Infinity}}
            defaultValue="// Type your code here"
            tabSize={2}
            value={this.state.aceValue}
          />
          <input type='button' value='Submit' onClick={(e) => this.submitCode(e) } />
          <div className="output">
            Output:
            { consoleArr }
            { showResult }
          </div>
      </div>
    );
  }
}
export default Challenge;
