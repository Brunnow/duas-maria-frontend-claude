import { RotatingLines } from 'react-loader-spinner';
const Loader = ({ text }) => {
  return (
    <div className="flex justify-center items-center w-full h-[450px]">
      <div className="flex flex-col items-center gap-4">
        <RotatingLines
          visible={true}
          height="96"
          width="96"
          color="#4B5563"
          strokeWidth="5"
          animationDuration="0.75"
          ariaLabel="rotating-lines-loading"
          wrapperStyle={{}}
          wrapperClass=""
        />
        <p className="text-slate-800">{text ? text : 'Carregando...'}</p>
      </div>
    </div>
  );
};

export default Loader;
