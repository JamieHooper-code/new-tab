// ============================================================
//  PANEL CONFIG — this is the only file you need to edit
//
//  type: "checklist" — items live in localStorage, can add/check/delete
//  type: "static"    — permanent list, edit items[] here in this config
//
//  For static panels each item can be a plain string:
//    "Do the thing"
//  Or an object with an optional tag:
//    { text: "Do the thing", tag: "daily" }   (tags: daily | weekly | anytime)
// ============================================================
const PANELS = [
  {
    id: "programming",
    title: "Programming To-Do",
    type: "checklist",
    items: [
      "Add VS Code Codex voice commands",
      "Add icon library Stream Deck voice commands",
      "Modify stream decks more programmatically",
      "Fix AHK++ VSCode extension not loading on boot",
      "Improve new tab page"
    ]
  },
  {
    id: "house",
    title: "House To-Do",
    type: "checklist",
    items: [
      "Stabilise washing machine",
      "Plant fruit trees",
      "Clean room",
      "Fix car windshield",
      "Set up binder"
    ]
  },
  {
    id: "rotation",
    title: "Rotation",
    type: "static",
    items: [
      { text: "Review programming to-do list",  tag: "daily"   },
      { text: "Clear email inbox",               tag: "daily"   },
      { text: "Check on any open projects",      tag: "daily"   },
      { text: "Tidy desk / workspace",           tag: "weekly"  },
      { text: "Review notes & scratch files",    tag: "weekly"  },
      { text: "Back up important files",         tag: "weekly"  },
      { text: "Go outside for a walk",           tag: "anytime" },
      { text: "Watch something you've queued",   tag: "anytime" },
      { text: "Read for 20 minutes",             tag: "anytime" }
    ]
  },
  {
    id: "brain",
    title: "Brain / Productivity",
    type: "static",
    items: [
      "If stuck on something, take a break and come back",
      "Break big tasks into the smallest next action",
      "Close unneeded browser tabs before starting work",
      "Write down anything floating in your head",
      "Timebox: 25 min focused work, 5 min break",
      "If overwhelmed, pick just ONE thing to do next",
      "If the pain is escalating beyond your baseline — stop. That's the signal, not the baseline itself",
      "Know the difference: background ache is manageable, sharp or climbing pain means stop now",
      "The task will still be there tomorrow — don't trade an hour of progress for days of recovery",
      "Locking in feels productive but a flare-up costs you far more time than a break does",
      "Stand up before you feel like you need to — by the time it feels urgent, you've waited too long",
      "Set a timer — when it goes off, get up regardless of where you are in the task"
    ]
  },
  {
    id: "checkin",
    title: "Check-In",
    type: "static",
    defaultCfg: { mode: 'random', limit: 10 },
    items: [
      { text: "Unclench your jaw and relax your face",                              tag: "body"   },
      { text: "Drop your shoulders — are they hunched near your ears?",             tag: "body"   },
      { text: "Are your hands gripping or tense? Open them flat",                  tag: "body"   },
      { text: "Check your posture — slouching, twisted, or off-centre?",           tag: "body"   },
      { text: "20-20-20: look 20 feet away for 20 seconds",                        tag: "body"   },
      { text: "When did you last drink water?",                                     tag: "body"   },
      { text: "When did you last eat?",                                             tag: "body"   },
      { text: "Any pain creeping up — back, neck, wrists, eyes? Note it honestly", tag: "body"   },
      { text: "Are you still working on what you intended to start?",               tag: "mind"   },
      { text: "Are you making actual progress, or going in circles?",               tag: "mind"   },
      { text: "What is the single next action right now?",                          tag: "mind"   },
      { text: "Have you been at this longer than 90 minutes without a break?",     tag: "mind"   },
      { text: "Is the urgency real, or are you hyperfocusing?",                    tag: "mind"   },
      { text: "Are you doing this because it matters, or avoiding something else?",tag: "mind"   },
      { text: "Take 3 slow, deep belly breaths right now",                         tag: "breath" },
      { text: "Box: inhale 4, hold 4, exhale 4, hold 4 — repeat 3×",              tag: "breath" },
      { text: "4-7-8: inhale 4, hold 7, exhale 8 — repeat 3×",                    tag: "breath" },
      { text: "Let the exhale be longer than the inhale — it calms the nervous system", tag: "breath" }
    ]
  },
  {
    id: "quotes",
    title: "Quotes to Remember",
    type: "static",
    items: [
      "Slow is smooth, smooth is fast",
      "The best time to plant a tree was 20 years ago. The second best time is now",
      "You don't rise to the level of your goals, you fall to the level of your systems",
      "Perfection is the enemy of done",
      "Do the thing, then you'll have the motivation"
    ]
  }
];
