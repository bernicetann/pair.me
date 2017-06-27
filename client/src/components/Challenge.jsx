import React, {Component} from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';
import axios from 'axios';

import 'brace/mode/javascript';
import 'brace/theme/monokai';

import ChatBox from './ChatBox.jsx';
import ChallengeQuestions from './ChallengeQuestions.jsx'
import ChallengeAnswer from './ChallengeAnswer.jsx'



const io = require('socket.io-client');
const socket = io();

class Challenge extends Component {
  constructor(props) {
    super(props);
    this.state = {
      result: null,
      console: [],
      aceValue: "",
      user: null,
      showAnswer: false,
      questions: {
        id: "",
        title: "",
        question: "",
        example: "",
        placeholder: "",
        answer: "",
        unit_test: "",
        test_result: ""
      },
      sendUpdate: true,
    }
    this.socket = io.connect();
    this.liveCode = this.liveCode.bind(this);
  }

  componentWillMount() {
    axios.get('/api/questions')
    .then((response)=> {
      this.setState({questions: {
        id: response.data[0].id,
        title: response.data[0].title,
        question: response.data[0].question,
        example: response.data[0].example,
        placeholder: response.data[0].placeholder,
        answer: response.data[0].answer,
        unit_test: response.data[0].unit_test,
        test_result: response.data[0].test_result
        }
      },
      this.setState({aceValue: `${response.data[0].example}\n\n${response.data[0].placeholder}`}))
    })
  }
  componentDidMount() {


    console.log('successfully mounted');
     axios.get('/api/profile_current')
     .then((response)=> {
       this.setState({user: response.data})
     });

    socket.on('serverLiveCode', (code)=> {
      this.setState({sendUpdate:true});
      this.setState({aceValue: code});
    });
  }


  //click to display answer
  onClick(e) {
    e.preventDefault();
    this.setState({ showAnswer: !this.state.showAnswer })
  }

  //function to track changes and send to server for broadcast
  liveCode() {
    // console.log('calling function');
    let editor = ace.edit('codeChallenges');
    let code = editor.getValue();
    if (this.state.sendUpdate) {
      socket.emit('liveCode', JSON.stringify({code: code }));
    }
    this.setState({sendUpdate:true});
  }
  submitCode(event){
    event.preventDefault();

    let editor = ace.edit('codeChallenges');
    let textValue = JSON.stringify(editor.getValue());
    let questionId = this.state.questions.id

    axios.post('/api/challenges', {
      answer: textValue,
      questionId: questionId
    })
    .then((response)=> {
      let outputData = JSON.parse(response.data);
      this.setState({result: outputData.result});
      this.setState({console: outputData.console});
    })
    .catch((error)=> {
      console.log(error);
    })
  }
  render() {
    let console = this.state.console;
    let consoleArr = [];
    for (let i = 0; i < console.length; i++) {
      consoleArr.push(
        <ul>console.log => { console[i] }</ul>
      )
    }
    let showResult = '';
    let result = this.state.result;
    if (result !== null && result !== 'null') {
      let test_result = this.state.questions.test_result
      if (result === test_result){
        showResult = <div className="resultLog">
                       <ul>Unit Test => {this.state.questions.unit_test}</ul>
                       <ul>Result => { result }</ul>
                       <ul>Expected Answer => {test_result}</ul>
                       <h3>CORRECT!</h3>
                     </div>
      } else {
        showResult = <div className="resultLog">
                       <ul>Unit Test=> {this.state.questions.unit_test}</ul>
                       <ul>Result => { result }</ul>
                       <ul>Expected Answer => {test_result}</ul>
                       <h3>Wrong, please try again</h3>
                     </div>
      }
    }
    return (

      <div>
        <ChallengeQuestions questions={ this.state.questions } />
        <ChatBox user={ this.state.user } />
      <div id='editor'>
        <AceEditor
          name="codeChallenges"
          mode="javascript"
          theme="monokai"
          editorProps={{$blockScrolling: Infinity}}
          tabSize={2}
          width={1750}
          height={600}
          //invoke livecode function everytime the text box changess
          onChange={ this.liveCode }
          value={this.state.aceValue}
        />
      </div>
        <input type='button' value='Submit' onClick={(e) => this.submitCode(e) } />

      <div className="output">
         <div className='output-header'>
            <h4>Output:</h4>
            <div className="consoleLog">{ consoleArr }</div>
            { showResult }
          </div>
        </div>

        <div className="showAnswer">
          <button onClick= {this.onClick.bind(this)}> Give me answeR</button>
          {this.state.showAnswer && <ChallengeAnswer answer= { this.state.questions } /> }
        </div>

      </div>

    );
  }
}
export default Challenge;