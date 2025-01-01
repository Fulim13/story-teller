from dataclasses import dataclass
from typing import List, Dict, Any
from langchain.chains import LLMChain
from langchain_openai.chat_models import ChatOpenAI
from langchain.memory import ConversationSummaryBufferMemory
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
)
from langchain_core.messages import SystemMessage


@dataclass
class Chapter:
    chapter_number: int
    chapter_title: str


@dataclass
class Outline:
    chapters: List[Chapter]

    @classmethod
    def from_nested_list(cls, data):
        # Extract chapters from the nested list structure
        chapters_data = next(item[1] for item in data if item[0] == 'chapters')
        chapters = [
            Chapter(
                chapter_number=int(chapter_dict[0][1]),
                chapter_title=str(chapter_dict[1][1])
            )
            for chapter_dict in chapters_data
        ]
        return cls(chapters=chapters)


class OnlyStoreAIMemory(ConversationSummaryBufferMemory):
    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, str]) -> None:
        input_str, output_str = self._get_input_output(inputs, outputs)
        self.chat_memory.add_ai_message(output_str)


class StoryGenerator:
    def __init__(
        self,
        genre: str,
        topic: str,
        outline: List,  # Changed to accept the nested list directly
        questions_and_answers: dict,
        characters,
    ):
        self.genre = genre
        self.topic = topic
        self.outline = Outline.from_nested_list(
            outline)  # Convert to Outline object
        self.questions_and_answers = questions_and_answers
        self.characters = characters

        prompt = f"""
        Act as a Story writer.
        You are currently writing a story on topic: {self.topic} which genre {self.genre}.
        This is the outline of the story: {self.outline.chapters}. You will be responsible for writing the story sections.
        ---
        Use your previous AI messages to avoid repeating yourself as you continually re-write the story sections.
        """
        chat = ChatOpenAI(model="gpt-3.5-turbo-16k")
        memory = OnlyStoreAIMemory(
            llm=chat,
            memory_key="chat_history",
            return_messages=True,
            max_token_limit=1200,
        )

        chat_prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessage(content=prompt),
                MessagesPlaceholder(variable_name="chat_history"),
                HumanMessagePromptTemplate.from_template("{human_input}"),
            ]
        )

        self.story_chain = LLMChain(
            llm=chat, prompt=chat_prompt, memory=memory, output_key="story"
        )

    def generate_stories(self) -> List[str]:
        story = []
        print("Generating the story...\n---")
        for chapter in self.outline.chapters:
            section_prompt = f"""
            You are writing a section for a chapter of a book. Use the following information and guidelines to craft the content.
            ---
            ### Chapter Details:
            - Chapter Number: {chapter.chapter_number}
            - Chapter Title: {chapter.chapter_title}

            ### Insights to Include:
            Below are the key insights gathered from interviews. These must be integrated into the section to enhance its relevance and ensure it ranks better:
            - {self.questions_and_answers}

            ### Character Information:
            The following information pertains to the characters and must be woven seamlessly into the section:
            - {self.characters}
            ---
            ### Writing Guidelines:
            - Write the content specifically for Chapter {chapter.chapter_number}: {chapter.chapter_title}.
            - Ensure the text aligns with the themes, narrative, and objectives of the chapter.
            - Use the character information ({self.characters}) effectively to develop the narrative or enhance the description.
            - The final section must be written in **Markdown (.md) format**.
            - Use proper headings, subheadings, lists, and other Markdown features for readability.
            ---
            ### Output Section:
            Write the following section:
            - Chapter {chapter.chapter_number}: {chapter.chapter_title}
            """
            result = self.story_chain.predict(human_input=section_prompt)
            story.append(result)

        print("Finished generating the story!\n---")
        return story
