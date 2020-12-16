import { Component, OnInit } from '@angular/core';

import { QuizService } from '../services/quiz.service';
import { HelperService } from '../services/helper.service';
import { Option, Question, Quiz, QuizConfig } from '../models/index';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  providers: [QuizService]
})
export class QuizComponent implements OnInit {
  quizes: any[];
  quiz: Quiz = new Quiz(null);
  mode = 'quiz';
  quizName: string;
  seconds = 0;
  config: QuizConfig = {
    'allowBack': true,
    'allowReview': true,
    'autoMove': false,  // if true, it will move to next question automatically when answered.
    'duration': 10,  // indicates the time (in secs) in which quiz needs to be completed. 0 means unlimited.
    'pageSize': 1,
    'requiredAll': false,  // indicates if you must answer all the questions before submitting.
    'richText': false,
    'shuffleQuestions': false,
    'shuffleOptions': false,
    'showClock': false,
    'showPager': true,
    'theme': 'none'
  };

  pager = {
    index: 0,
    size: 1,
    count: 1
  };
  timer: any = null;
  startTime: Date;
  endTime: Date;
  ellapsedTime = '00:00';
  duration = '';
  started = false;

  constructor(private quizService: QuizService) { }

  ngOnInit() {
    this.quizes = this.quizService.getAll();
  }

  selectQuiz(quizName: string) {
    this.quizName = quizName;
    this.loadQuiz();
  }

  startQuiz() {
    this.started = true;
    this.startTime = new Date();
    this.ellapsedTime = '00:00';
    this.setTimer();
    this.duration = this.parseTime(this.config.duration);
  }

  loadQuiz() {
    this.quizService.get(this.quizName).subscribe(res => {
      this.quiz = new Quiz(res);
      this.pager.count = this.quiz.questions.length;
      this.config = this.quiz.config || this.config;
    });
    this.mode = 'quiz';
  }

  setTimer() {
    this.timer = setInterval(() => {
      this.tick(); 
      this.seconds++;
      if (this.seconds === this.config.duration) {
        this.clearTimer();
      }
    }, 1000);
  }

  clearTimer() {
    clearInterval(this.timer);
  }

  tick() {
    const now = new Date();
    const diff = (now.getTime() - this.startTime.getTime()) / 1000;
    if (diff >= this.config.duration) {
      this.onSubmit();
    }
    this.ellapsedTime = this.parseTime(diff);
  }

  parseTime(totalSeconds: number) {
    let mins: string | number = Math.floor(totalSeconds / 60);
    let secs: string | number = Math.round(totalSeconds % 60);
    mins = (mins < 10 ? '0' : '') + mins;
    secs = (secs < 10 ? '0' : '') + secs;
    return `${mins}:${secs}`;
  }

  get filteredQuestions() {
    return (this.quiz.questions) ?
      this.quiz.questions.slice(this.pager.index, this.pager.index + this.pager.size) : [];
  }

  onSelect(question: Question, option: Option) {
    if (question.questionTypeId === 1) {
      question.options.forEach((x) => { if (x.id !== option.id) x.selected = false; });
    }

    if (this.config.autoMove) {
      this.goTo(this.pager.index + 1);
    }
  }

  goTo(index: number) {
    if (index >= 0 && index < this.pager.count) {
      this.pager.index = index;
      this.mode = 'quiz';
    }
  }

  isAnswered(question: Question) {
    return question.options.find(x => x.selected) ? 'Answered' : 'Not Answered';
  };

  isCorrect(question: Question) {
    const selected = question.options.filter(x => x.selected);
    const correct = question.options.every(x => x.selected === x.isAnswer);
    let msg = '';
    if (correct) {
      msg = 'correct';
    } else {
      msg = 'wrong';
    }

    if (!selected.length) {
      msg += ' (no answer given)';
    }

    return msg;
  };

  onSubmit() {
    let answers = [];
    this.quiz.questions.forEach(x => {
      const answer = x.options.find(o => o.selected);
      answers.push({ 'quizId': this.quiz.id, 'questionId': x.id, 'answered': answer && answer.id || undefined  });
    });

    // Post your data to the server here. answers contains the questionId and the users' answer.
    //console.log(this.quiz.questions);
    //console.log(answers);
    this.mode = 'result';
  }
}
