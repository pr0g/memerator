import { useState, FormEventHandler } from "react";
import {
  AiOutlinePlusCircle,
  AiOutlineMinusCircle,
  AiOutlineRobot,
  AiOutlineEdit,
} from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useQuery, createMeme, getAllMemes } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { Link } from "react-router-dom";

export function HomePage() {
  const [topics, setTopics] = useState([""]);
  const [audience, setAudience] = useState("");
  const [isMemeGenerating, setIsMemeGenerating] = useState(false);

  let navigate = useNavigate();
  const { data: user } = useAuth();
  const { data: memes, isLoading, error } = useQuery(getAllMemes);

  const handleGenerateMeme: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (topics.join("").trim().length === 0 || audience.length === 0) {
      alert("Please provide one or more topics and an audience");
      return;
    }
    try {
      setIsMemeGenerating(true);
      await createMeme({ topics, audience });
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert("Error generating meme: " + e.message);
      } else {
        alert("Error generating meme: " + JSON.stringify(e));
      }
    } finally {
      setIsMemeGenerating(false);
    }
  };

  const handleDeleteMeme = async (id: string) => {
    // todo
  };

  if (isLoading) {
    return "Loading...";
  }
  if (error) {
    return "Error: " + error;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to Memerator!</h1>
      <p className="mb-4">
        Start generating meme ideas by providing topics and intended audience.
      </p>
      <form onSubmit={handleGenerateMeme}>
        <div className="mb-4 max-w-[500px]">
          <label htmlFor="topics" className="block font-bold mb-2">
            Topics:
          </label>
          {topics.map((topic, index) => (
            <input
              key={index}
              type="text"
              id="topics"
              value={topic}
              onChange={(e) => {
                const updatedTopics = [...topics];
                updatedTopics[index] = e.target.value;
                setTopics(updatedTopics);
              }}
              className="p-1 mr-1 mb-1 border rounded text-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          ))}
          <div className="flex items-center my-2 gap-1">
            <button
              type="button"
              onClick={() => topics.length < 3 && setTopics([...topics, ""])}
              className="flex items-center gap-1 bg-primary-200 hover:bg-primary-300 border-2 text-black text-xs py-1 px-2 rounded"
            >
              <AiOutlinePlusCircle /> Add Topic
            </button>
            {topics.length > 1 && (
              <button
                onClick={() => setTopics(topics.slice(0, -1))}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-700 border-2 text-white text-xs py-1 px-2 rounded"
              >
                <AiOutlineMinusCircle /> Remove Topic
              </button>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="audience" className="block font-bold mb-2">
            Intended Audience:
          </label>
          <input
            type="text"
            id="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="p-1 border rounded text-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className={`flex items-center gap-1 bg-primary-200 hover:bg-primary-300 border-2 text-black text-sm font-bold py-1 px-2 rounded ${
            isMemeGenerating
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          } $}`}
        >
          <AiOutlineRobot />
          {!isMemeGenerating ? "Generate Meme" : "Generating..."}
        </button>
      </form>
      {!!memes && memes.length > 0 ? (
        memes.map((memeIdea) => (
          <div key={memeIdea.id} className="mt-4 p-4 bg-gray-100 rounded-lg">
            <img src={memeIdea.url} width="500px" />
            <div className="flex flex-col items-start mt-2">
              <div>
                <span className="text-sm text-gray-700">Topics: </span>
                <span className="text-sm italic text-gray-500">
                  {memeIdea.topics}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-700">Audience: </span>
                <span className="text-sm italic text-gray-500">
                  {memeIdea.audience}
                </span>
              </div>
            </div>
            {user && (user.isAdmin || user.id === memeIdea.userId) && (
              <div className="flex items-center mt-2">
                <Link key={memeIdea.id} to={`/meme/${memeIdea.id}`}>
                  <button className="flex items-center gap-1 bg-primary-200 hover:bg-primary-300 border-2 text-black text-xs py-1 px-2 rounded">
                    <AiOutlineEdit />
                    Edit Meme
                  </button>
                </Link>
                {/* TODO: add delete meme functionality */}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="flex justify-center mt-5">No memes found 😕</div>
      )}
    </div>
  );
}
