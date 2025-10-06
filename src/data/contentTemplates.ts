export interface ContentTemplate {
  id: string;
  type: 'assignment' | 'game';
  contentType: string;
  name: string;
  description: string;
  level: string;
  skill?: string;
  template: {
    title: string;
    description: string;
    content: Record<string, unknown>;
    objectives?: string[];
    rubric?: Record<string, unknown>;
    tags?: string[];
    estimatedDuration?: number;
    // Game-specific fields
    configuration?: Record<string, unknown>;
    game_type?: string;
  };
}

export const contentTemplates: ContentTemplate[] = [
  // Assignment Templates
  {
    id: 'mcq-basic',
    type: 'assignment',
    contentType: 'mcq',
    name: 'Bài tập trắc nghiệm cơ bản',
    description: 'Template cho bài tập trắc nghiệm đơn giản với 4 lựa chọn',
    level: 'A1-B1',
    skill: 'Vocabulary',
    template: {
      title: 'Bài tập trắc nghiệm: [Chủ đề]',
      description: 'Hoàn thành bài tập trắc nghiệm bằng cách chọn đáp án đúng.',
      content: {
        instructions: 'Hãy đọc câu hỏi và chọn đáp án đúng nhất.',
        questions: [
          {
            question: 'Câu hỏi mẫu 1',
            options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
            correctAnswer: 0,
            explanation: 'Giải thích tại sao đáp án này đúng.'
          }
        ]
      },
      objectives: [
        'Nhận biết từ vựng cơ bản',
        'Phát triển kỹ năng đọc hiểu'
      ],
      rubric: {
        criteria: [
          {
            name: 'Độ chính xác',
            description: 'Số câu trả lời đúng',
            weight: 80,
            levels: {
              excellent: '90-100% đúng',
              good: '70-89% đúng',
              fair: '50-69% đúng',
              poor: 'Dưới 50% đúng'
            }
          },
          {
            name: 'Hiểu biết',
            description: 'Khả năng giải thích đáp án',
            weight: 20,
            levels: {
              excellent: 'Giải thích rõ ràng và chính xác',
              good: 'Giải thích khá tốt',
              fair: 'Giải thích cơ bản',
              poor: 'Không giải thích được'
            }
          }
        ]
      },
      tags: ['Trắc nghiệm', 'Vocabulary', 'Reading'],
      estimatedDuration: 15
    }
  },

  {
    id: 'essay-academic',
    type: 'assignment',
    contentType: 'essay',
    name: 'Bài luận học thuật',
    description: 'Template cho bài luận với cấu trúc chuẩn',
    level: 'B2-C1',
    skill: 'Writing',
    template: {
      title: 'Bài luận: [Chủ đề]',
      description: 'Viết một bài luận về chủ đề được giao.',
      content: {
        instructions: 'Viết một bài luận khoảng 250-300 từ về chủ đề sau. Bài luận cần có cấu trúc rõ ràng với phần mở đầu, thân bài và kết luận.',
        prompt: 'Thảo luận về tác động của công nghệ đối với cuộc sống hàng ngày. Bạn nghĩ điều này có tích cực hay tiêu cực hơn?',
        requirements: [
          'Độ dài: 250-300 từ',
          'Cấu trúc: Mở đầu, Thân bài (2-3 đoạn), Kết luận',
          'Ngôn ngữ: Chính thức, học thuật'
        ]
      },
      objectives: [
        'Phát triển kỹ năng viết luận',
        'Sử dụng ngôn ngữ học thuật',
        'Tổ chức ý tưởng logic'
      ],
      rubric: {
        criteria: [
          {
            name: 'Nội dung',
            description: 'Chất lượng và độ sâu của lập luận',
            weight: 40,
            levels: {
              excellent: 'Lập luận sâu sắc, có ví dụ phong phú',
              good: 'Lập luận tốt, có ví dụ',
              fair: 'Lập luận cơ bản',
              poor: 'Lập luận yếu, thiếu ví dụ'
            }
          },
          {
            name: 'Ngôn ngữ',
            description: 'Độ chính xác và phong phú của từ vựng/ngữ pháp',
            weight: 35,
            levels: {
              excellent: 'Ngôn ngữ phong phú, chính xác',
              good: 'Ngôn ngữ khá tốt',
              fair: 'Ngôn ngữ cơ bản',
              poor: 'Nhiều lỗi ngôn ngữ'
            }
          },
          {
            name: 'Cấu trúc',
            description: 'Tổ chức bài viết',
            weight: 25,
            levels: {
              excellent: 'Cấu trúc hoàn hảo, logic',
              good: 'Cấu trúc tốt',
              fair: 'Cấu trúc cơ bản',
              poor: 'Không có cấu trúc rõ ràng'
            }
          }
        ]
      },
      tags: ['Writing', 'Essay', 'Academic'],
      estimatedDuration: 60
    }
  },

  {
    id: 'speaking-presentation',
    type: 'assignment',
    contentType: 'speaking',
    name: 'Bài thuyết trình',
    description: 'Template cho bài thuyết trình cá nhân',
    level: 'B1-C1',
    skill: 'Speaking',
    template: {
      title: 'Thuyết trình: [Chủ đề]',
      description: 'Chuẩn bị và trình bày một bài thuyết trình.',
      content: {
        instructions: 'Chuẩn bị một bài thuyết trình 3-5 phút về chủ đề được giao. Sử dụng visual aids và trả lời câu hỏi từ người nghe.',
        requirements: [
          'Thời lượng: 3-5 phút',
          'Sử dụng visual aids (slides, hình ảnh)',
          'Trả lời câu hỏi từ người nghe',
          'Ngôn ngữ: Tự nhiên, rõ ràng'
        ],
        evaluation_criteria: [
          'Nội dung và cấu trúc',
          'Khả năng trình bày',
          'Tương tác với người nghe',
          'Sử dụng ngôn ngữ'
        ]
      },
      objectives: [
        'Phát triển kỹ năng thuyết trình',
        'Tự tin khi nói trước đám đông',
        'Tổ chức thông tin hiệu quả'
      ],
      rubric: {
        criteria: [
          {
            name: 'Nội dung',
            description: 'Chất lượng thông tin và cấu trúc',
            weight: 30,
            levels: {
              excellent: 'Nội dung phong phú, cấu trúc logic',
              good: 'Nội dung tốt, cấu trúc rõ ràng',
              fair: 'Nội dung cơ bản',
              poor: 'Nội dung nghèo nàn'
            }
          },
          {
            name: 'Trình bày',
            description: 'Khả năng giao tiếp và tương tác',
            weight: 35,
            levels: {
              excellent: 'Tự tin, tương tác tốt',
              good: 'Khá tự tin, tương tác ổn',
              fair: 'Thiếu tự tin',
              poor: 'Rất thiếu tự tin, khó hiểu'
            }
          },
          {
            name: 'Ngôn ngữ',
            description: 'Độ chính xác và phong phú',
            weight: 25,
            levels: {
              excellent: 'Ngôn ngữ phong phú, ít lỗi',
              good: 'Ngôn ngữ khá tốt',
              fair: 'Ngôn ngữ cơ bản',
              poor: 'Nhiều lỗi, khó hiểu'
            }
          },
          {
            name: 'Visual Aids',
            description: 'Sử dụng hỗ trợ thị giác',
            weight: 10,
            levels: {
              excellent: 'Sử dụng hiệu quả',
              good: 'Sử dụng khá tốt',
              fair: 'Sử dụng cơ bản',
              poor: 'Không sử dụng hoặc sử dụng kém'
            }
          }
        ]
      },
      tags: ['Speaking', 'Presentation', 'Public Speaking'],
      estimatedDuration: 45
    }
  },

  // Game Templates
  {
    id: 'flashcard-vocab',
    type: 'game',
    contentType: 'flashcard',
    name: 'Flashcard Từ vựng',
    description: 'Trò chơi flashcard tương tác cho từ vựng',
    level: 'A1-B1',
    skill: 'Vocabulary',
    template: {
      title: 'Flashcard: [Chủ đề từ vựng]',
      description: 'Ôn tập từ vựng thông qua flashcards tương tác.',
      content: {
        rules: 'Xem từ vựng và hình ảnh, sau đó chọn nghĩa đúng hoặc phát âm từ.',
        setup: 'Mỗi học viên có một thiết bị hoặc chơi theo nhóm.',
        materials: ['Thiết bị có internet', 'Danh sách từ vựng'],
        rounds: [
          'Vòng 1: Xem từ và chọn nghĩa',
          'Vòng 2: Nghe phát âm và viết từ',
          'Vòng 3: Sử dụng từ trong câu'
        ],
        scoring: 'Điểm cho mỗi câu trả lời đúng. Bonus cho tốc độ.'
      },
      objectives: [
        'Ôn tập từ vựng chủ đề',
        'Phát triển kỹ năng nhận biết từ',
        'Tăng tốc độ ghi nhớ'
      ],
      configuration: {
        minPlayers: 1,
        maxPlayers: 10,
        durationMinutes: 15,
        difficulty: 'easy',
        gameMode: 'flashcard'
      },
      game_type: 'flashcard',
      tags: ['Vocabulary', 'Flashcard', 'Interactive'],
      estimatedDuration: 15
    }
  },

  {
    id: 'kahoot-quiz',
    type: 'game',
    contentType: 'kahoot_style',
    name: 'Quiz tương tác Kahoot',
    description: 'Trò chơi quiz tương tác với bảng xếp hạng',
    level: 'A1-C1',
    skill: 'Mixed',
    template: {
      title: 'Quiz: [Chủ đề]',
      description: 'Trả lời câu hỏi nhanh trong thời gian quy định.',
      content: {
        rules: 'Trả lời câu hỏi nhanh nhất có thể. Điểm thưởng cho tốc độ.',
        setup: 'Mỗi học viên cần thiết bị kết nối internet.',
        materials: ['Thiết bị cá nhân', 'Màn hình chung để hiển thị bảng xếp hạng'],
        rounds: [
          '10 câu hỏi trắc nghiệm',
          '5 câu hỏi dạng text input',
          '3 câu hỏi dạng true/false'
        ],
        scoring: '100 điểm cho câu đúng. Bonus points cho 3 người trả lời nhanh nhất.'
      },
      objectives: [
        'Ôn tập kiến thức',
        'Phát triển tư duy nhanh',
        'Tạo không khí cạnh tranh lành mạnh'
      ],
      configuration: {
        minPlayers: 2,
        maxPlayers: 50,
        durationMinutes: 20,
        difficulty: 'medium',
        gameMode: 'kahoot_style',
        questionCount: 18,
        timePerQuestion: 20
      },
      game_type: 'kahoot_style',
      tags: ['Quiz', 'Competition', 'Interactive'],
      estimatedDuration: 20
    }
  },

  {
    id: 'crossword-puzzle',
    type: 'game',
    contentType: 'crossword',
    name: 'Ô chữ',
    description: 'Trò chơi ô chữ với chủ đề từ vựng',
    level: 'A2-B2',
    skill: 'Vocabulary',
    template: {
      title: 'Ô chữ: [Chủ đề]',
      description: 'Điền từ vào ô chữ dựa trên định nghĩa.',
      content: {
        rules: 'Đọc định nghĩa và điền từ thích hợp vào ô chữ.',
        setup: 'Có thể chơi cá nhân hoặc theo nhóm.',
        materials: ['Bản in ô chữ', 'Bút', 'Đồng hồ bấm giờ'],
        rounds: [
          'Vòng 1: Điền ngang',
          'Vòng 2: Điền dọc',
          'Vòng 3: Điền các từ còn lại'
        ],
        scoring: 'Điểm cho mỗi từ đúng. Bonus cho hoàn thành nhanh.'
      },
      objectives: [
        'Ôn tập từ vựng theo chủ đề',
        'Phát triển kỹ năng suy luận',
        'Tăng khả năng tập trung'
      ],
      configuration: {
        minPlayers: 1,
        maxPlayers: 4,
        durationMinutes: 25,
        difficulty: 'medium',
        gameMode: 'crossword',
        gridSize: '15x15',
        wordCount: 20
      },
      game_type: 'crossword',
      tags: ['Vocabulary', 'Puzzle', 'Logic'],
      estimatedDuration: 25
    }
  },

  {
    id: 'listening-challenge',
    type: 'game',
    contentType: 'listening_challenge',
    name: 'Thách thức nghe',
    description: 'Trò chơi nghe và điền từ thiếu',
    level: 'A1-B1',
    skill: 'Listening',
    template: {
      title: 'Listening Challenge: [Chủ đề]',
      description: 'Nghe audio và điền các từ còn thiếu.',
      content: {
        rules: 'Nghe đoạn audio và điền các từ còn thiếu trong văn bản.',
        setup: 'Mỗi học viên có một bản sao văn bản với chỗ trống.',
        materials: ['Audio player', 'Bản sao văn bản với chỗ trống'],
        rounds: [
          'Lần nghe 1: Lắng nghe tổng quan',
          'Lần nghe 2: Điền từ',
          'Lần nghe 3: Kiểm tra đáp án'
        ],
        scoring: 'Điểm cho mỗi từ đúng. Bonus cho hoàn thành sớm.'
      },
      objectives: [
        'Phát triển kỹ năng nghe hiểu',
        'Ôn tập từ vựng',
        'Cải thiện khả năng ghi nhớ'
      ],
      configuration: {
        minPlayers: 1,
        maxPlayers: 20,
        durationMinutes: 15,
        difficulty: 'easy',
        gameMode: 'listening_challenge',
        listenCount: 3,
        blankWords: 15
      },
      game_type: 'listening_challenge',
      tags: ['Listening', 'Audio', 'Vocabulary'],
      estimatedDuration: 15
    }
  }
];

export const getTemplatesByType = (type: 'assignment' | 'game'): ContentTemplate[] => {
  return contentTemplates.filter(template => template.type === type);
};

export const getTemplateById = (id: string): ContentTemplate | undefined => {
  return contentTemplates.find(template => template.id === id);
};

export const getTemplatesByContentType = (contentType: string): ContentTemplate[] => {
  return contentTemplates.filter(template => template.contentType === contentType);
};