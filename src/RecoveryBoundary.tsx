import {Component,type ReactNode} from 'react';
import {downloadBlob} from './exports';
export class RecoveryBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return{failed:true};}
 componentDidCatch(error:Error){try{sessionStorage.setItem('cmf-last-error',JSON.stringify({name:error.name,message:error.message.slice(0,500),time:new Date().toISOString()}));}catch{/* Storage can be unavailable. */}}
 backup=()=>{try{const json=localStorage.getItem('cmf-pattern-studio-v1');if(json)downloadBlob(new Blob([json],{type:'application/json'}),'CMF-recovery.json');}catch{/* Keep the recovery controls available if storage is blocked. */}};
 render(){if(!this.state.failed)return this.props.children;return <main className="recovery-screen" role="alert"><h1>工作台暫時中斷</h1><p>上次儲存的設計仍保留在此瀏覽器。可以先下載備份，再恢復工作台。</p><div><button className="button" onClick={this.backup}>下載專案備份</button><button className="button primary" onClick={()=>this.setState({failed:false})}>恢復上次儲存的設計</button></div><p>若再次中斷，請提供裝置、瀏覽器與最後操作，協助查明原因。</p></main>;}
}
