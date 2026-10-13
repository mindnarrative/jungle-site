import Link from 'next/link';
export default function NotFound() {
  return (<div className="read stack"><h1>찾는 쪽이 없습니다</h1><p className="lead">주소가 바뀌었거나, 볼 수 있는 사람만 여는 쪽일 수 있습니다.</p><p><Link className="btn" href="/">첫 화면으로</Link></p></div>);
}
