import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CourseKnowledgeService } from '../course-knowledge/course-knowledge.service';

export type AiStyle = 'serious' | 'friendly' | 'warm' | 'challenge';

@Injectable()
export class AiEngineService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(
    private configService: ConfigService,
    private courseKnowledgeService: CourseKnowledgeService,
  ) {
    this.apiUrl = this.configService.get('DEEPSEEK_API_URL') || 'https://api.deepseek.com/v1/chat/completions';
    this.apiKey = this.configService.get('DEEPSEEK_API_KEY') || '';
    this.model = this.configService.get('DEEPSEEK_MODEL') || 'deepseek-chat';
  }

  async generateScript(data: any, status: any, style: AiStyle = 'friendly'): Promise<string> {
    if (!this.apiKey) {
      throw new BadRequestException('DeepSeek API Key 未配置');
    }

    const prompt = await this.buildPrompt(data, status);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.getSystemPrompt(style) },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new BadRequestException(`DeepSeek API 错误: ${err}`);
      }

      const result = await response.json();
      return result.choices?.[0]?.message?.content || '';
    } catch (error) {
      throw new BadRequestException(`话术生成失败: ${error.message}`);
    }
  }

  private getSystemPrompt(style: AiStyle): string {
    const base = `你是一位资深的少儿编程C++教培老师，擅长撰写家长回访话术。
请根据学员数据、老师的状态评价以及本节课知识点，生成一段专业、有针对性的回访话术。
严格按以下模块输出：
【授课内容】（必须结合本节课知识点展开，具体说明学了什么概念、用途、重难点，不要泛泛而谈）
【课中表现】
【下节课预告】（如适用）
【本周任务】
用学员姓名称呼，数据引用准确，不要编造未提供的数据。总字数控制在300-500字。

重要约束：
- 不要以"我是...老师"、"大家好"等自我介绍开头，直接切入内容。
- 不要提及"本周是周几"、"本周是第几周"等时间说明。
- 不要出现"以上是我的反馈"等结束语。`;

    const styleHints: Record<AiStyle, string> = {
      serious: `语气风格要求（严肃型）：
- 你是一位年轻男老师，说话简洁干练、逻辑清晰，不拖泥带水。
- 语气正式但有温度，不过度寒暄，点到为止。
- 多用肯定句和结论性表述，少用夸张修饰词。
- 对学生的问题直接指出，对优点客观肯定，整体风格偏理性、专业。
- 【授课内容】模块开头格式示例："xx妈妈/爸爸，本周我们学习了xxx课程。这是C++中一个非常重要的概念..."
- 【本周任务】用数字编号列出具体要求，如"1、完成回放视频观看以及课中题目。2、课后作业1和2必须完成..."`,
      friendly: `语气风格要求（友善型）：
- 你是一位性格友好、活泼的老师，说话轻松自然，像朋友一样交流。
- 适当使用鼓励性语句和积极的表情化表达（通过文字传递热情）。
- 语气亲切活泼，可以用"咱们"、"一起加油"等亲切表达。
- 对学生的进步由衷肯定，对需要改进的地方温和提醒。
- 善用emoji表情符号（如🔴🟠🟢📺💪🌟等）让内容更生动。
- 任务可以按优先级分颜色标注：🔴高优先级、🟠中优先级、🟢低优先级。`,
      warm: `语气风格要求（亲和型）：
- 你是一位亲和力强的女老师，说话温柔细腻、充满关怀，像家人一样温暖。
- 多用"呀"、"呢"、"哦"等语气词，善用"～"符号，让家长感受到耐心和体贴。
- 可以适当使用花朵、太阳等温暖emoji（如🌻📺💪等）。
- 善于发现孩子的闪光点，用包容的态度描述不足，给出温柔而具体的建议。
- 整体语气柔和、鼓励为主，让家长感受到老师对孩子真心的关注和爱护。
- 结尾可以用鼓励性语句如"我们一起加油！"`,
      challenge: `语气风格要求（激励挑战型）：
- 你是一位充满激情和感染力的老师，善于用目标感和成就感驱动学生。
- 语气充满能量，用挑战、闯关、升级等游戏化语言激发孩子的斗志。
- 对孩子的优点大力表扬并"拔高"，对孩子的不足转化为"下一个待解锁的成就"。
- 善于设置小目标和挑战任务，让孩子感到"我能行""我可以做到"。
- 用"恭喜xx完成了...""xx已经具备了...的能力""下一关我们要挑战..."等表达方式。
- 结尾要给出明确的挑战目标，让孩子有冲劲。`,
    };

    return `${base}\n\n${styleHints[style]}`;
  }

  private async buildPrompt(data: any, status: any): Promise<string> {
    const scenario = this.detectScenario(data, status);
    let scenarioHint = '';

    if (scenario === 'absent') {
      scenarioHint = '该学员本周缺勤，话术以补课提醒为主，不引用课中数据。';
    } else if (scenario === 'struggling') {
      scenarioHint = '该学员课中表现较弱但基础尚可，话术以委婉鼓励为主，强调基础扎实，给出具体练习建议。';
    } else if (scenario === 'excellent') {
      scenarioHint = '该学员表现优秀，话术以鼓励巩固为主，建议适当挑战。';
    }

    const knowledge = await this.courseKnowledgeService.findByCourseName(data.courseName);
    let knowledgeSection = '';
    if (knowledge && knowledge.keyPoints) {
      knowledgeSection = `
【本节课知识点】
课程名称: ${knowledge.courseName}
核心知识点:
${knowledge.keyPoints}
`;
    }

    return `【学员数据】
- 学员姓名: ${data.userName}
- 课程名称: ${data.courseName}
- 上课时间: ${data.lessonStartTime}
- 出勤状态: ${data.isAbsent ? '缺勤' : data.isAttended ? '到课' : '异常'}
- 有效上课时长: ${data.effectiveDuration}分钟
- 课后作业正确率: ${data.homeworkAccuracy ?? '--'}%
- 拓展练习正确率: ${data.extensionAccuracy ?? '--'}%
- 获得奖杯数: ${data.trophyCount}
- 开麦时长: ${data.micDuration}分钟
- 开摄像头时长: ${data.cameraDuration}分钟
${knowledgeSection}
【老师状态评价】
- 出勤确认: ${status?.attendanceStatus || '未评价'}
- 课堂表现: ${status?.performanceLevel || '未评价'}
- 作业情况: ${status?.homeworkStatus || '未评价'}
- 备注: ${status?.remarks || '无'}

【场景提示】
${scenarioHint}

请生成回访话术。`;
  }

  private detectScenario(data: any, status: any): string {
    if (data.isAbsent) return 'absent';
    if (status?.performanceLevel === '需关注') return 'struggling';
    if (data.homeworkAccuracy >= 90 && data.extensionAccuracy >= 90) return 'excellent';
    return 'normal';
  }
}
